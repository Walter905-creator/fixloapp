const express = require('express');
const mongoose = require('mongoose');
const requireAuth = require('../middleware/requireAuth');
const JobRequest = require('../models/JobRequest');
const HourlyProject = require('../models/HourlyProject');
const { makeDraft } = require('../services/hourlyWorkflow');

const router = express.Router();
router.use(requireAuth);
// Feature is disabled by default. Never touch existing live checkout routes.
router.use((req, res, next) => process.env.HOURLY_WORKFLOW_ENABLED === 'true'
  ? next() : res.status(404).json({ error: 'Hourly workflow not enabled' }));

async function authorize(req, res, next) {
  try {
    const job = await JobRequest.findById(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const { role, id, email, isAdmin } = req.user;
    const admin = role === 'admin' || isAdmin === true;
    const pro = ['pro', 'professional'].includes(role) &&
      [job.assignedTo, job.assignedProId].some(v => v && String(v) === String(id));
    const homeowner = role === 'homeowner' && !!email &&
      job.email?.toLowerCase() === String(email).toLowerCase();
    if (!admin && !pro && !homeowner) return res.status(403).json({ error: 'Not authorized for project' });
    req.hourlyJob = job;
    req.canWork = admin || pro;
    req.actor = String(id || email || 'admin');
    next();
  } catch (e) { next(e); }
}
router.use('/:jobId', (req,res,next) => mongoose.isValidObjectId(req.params.jobId)
  ? next() : res.status(400).json({error:'Invalid job ID'}), authorize);

async function projectFor(req) {
  return HourlyProject.findOne({ jobId: req.hourlyJob._id });
}
function ownerOnly(req,res,next) {
  return req.canWork ? next() : res.status(403).json({error:'Professional or admin required'});
}
router.get('/:jobId', async (req,res,next) => {
  try {
    const p=await projectFor(req);
    if (!p) return res.status(404).json({error:'Hourly project not initialized'});
    res.json({project:p, provisional:!!p.sessions.find(s=>s.status==='running')});
  } catch(e){next(e);}
});
router.post('/:jobId/initialize', ownerOnly, async(req,res,next)=>{
  try {
    const cents=req.body.hourlyRateCents;
    if (!Number.isSafeInteger(cents) || cents <= 0 || cents > 1000000) return res.status(400).json({error:'Invalid rate'});
    const p=await HourlyProject.findOneAndUpdate(
      {jobId:req.hourlyJob._id}, {$setOnInsert:{hourlyRateCents:cents}},
      {new:true,upsert:true,runValidators:true}
    );
    res.json({project:p});
  } catch(e){next(e);}
});
router.post('/:jobId/tasks', async(req,res,next)=>{
  try {
    const title=String(req.body.title||'').trim();
    if (!title || title.length > 300) return res.status(400).json({error:'Task title must be 1-300 characters'});
    const p=await projectFor(req);
    if (!p) return res.status(404).json({error:'Initialize project first'});
    p.tasks.push({title,createdBy:req.actor});
    p.audit.push({action:'task_added',actor:req.actor,detail:{title}});
    await p.save();
    res.status(201).json({task:p.tasks[p.tasks.length-1]});
  }catch(e){next(e);}
});
router.patch('/:jobId/tasks/:taskId', ownerOnly, async(req,res,next)=>{
  try {
    const p=await projectFor(req);
    if (!p) return res.status(404).json({error:'Project not found'});
    const task=p.tasks.id(req.params.taskId);
    if (!task) return res.status(404).json({error:'Task not found'});
    if (typeof req.body.completed !== 'boolean') return res.status(400).json({error:'Boolean completed required'});
    task.completed=req.body.completed;
    task.completedAt=task.completed?new Date():undefined;
    p.audit.push({action:'task_status_changed',actor:req.actor,detail:{taskId:String(task._id),completed:task.completed}});
    await p.save();
    res.json({task});
  }catch(e){next(e);}
});
router.post('/:jobId/clock-in', ownerOnly, async(req,res,next)=>{
  try {
    const p=await projectFor(req);
    if (!p) return res.status(404).json({error:'Project not found'});
    if (p.sessions.some(s=>s.status==='running')) return res.status(409).json({error:'A session is already running'});
    p.sessions.push({startedAt:new Date(),hourlyRateCents:p.hourlyRateCents});
    p.audit.push({action:'clock_in',actor:req.actor});
    await p.save();
    res.status(201).json({session:p.sessions[p.sessions.length-1]});
  }catch(e){next(e);}
});
router.post('/:jobId/clock-out', ownerOnly, async(req,res,next)=>{
  try {
    const p=await projectFor(req);
    if (!p) return res.status(404).json({error:'Project not found'});
    const s=p.sessions.find(s=>s.status==='running');
    if (!s) return res.status(409).json({error:'No running session'});
    const endedAt=new Date();
    const draft=makeDraft({startedAt:s.startedAt,endedAt,hourlyRateCents:s.hourlyRateCents,materials:[]});
    s.endedAt=endedAt;s.minutes=draft.minutes;s.status='draft';
    s.completedTaskIds=p.tasks.filter(t=>t.completed && t.completedAt && t.completedAt>=s.startedAt && t.completedAt<=endedAt).map(t=>t._id);
    p.audit.push({action:'clock_out_draft',actor:req.actor,detail:{sessionId:String(s._id),totalCents:draft.totalCents}});
    await p.save();
    res.json({session:s,draft,invoiceSent:false,charged:false});
  }catch(e){next(e);}
});
module.exports=router;
