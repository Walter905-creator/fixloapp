const express = require('express');
const router = express.Router();
const { 
  calculateTax, 
  getTaxConfig, 
  isTaxIdRequired, 
  getTaxIdName 
} = require('../config/taxes');
const { 
  getComplianceRequirements,
  checkCompliance,
  getWithdrawalPeriod 
} = require('../utils/compliance');

/**
 * GET /api/compliance/:countryCode
 * Get compliance requirements for a country
 */
router.get('/:countryCode', (req, res) => {
  try {
    const { countryCode } = req.params;
    const requirements = getComplianceRequirements(countryCode.toUpperCase());
    
    if (!requirements) {
      return res.status(404).json({
        success: false,
        error: `Compliance requirements not found for ${countryCode}`,
        timestamp: new Date().toISOString()
      });
    }
    
    const taxConfig = getTaxConfig(countryCode.toUpperCase());
    const withdrawalPeriod = getWithdrawalPeriod(countryCode.toUpperCase());
    
    res.json({
      success: true,
      data: {
        countryCode: countryCode.toUpperCase(),
        requirements,
        tax: taxConfig,
        withdrawalPeriod
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching compliance requirements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch compliance requirements',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/compliance/check/:countryCode
 * Check compliance status for a country
 */
router.post('/check/:countryCode', (req, res) => {
  try {
    const { countryCode } = req.params;
    const currentStatus = req.body || {};
    
    const complianceCheck = checkCompliance(countryCode.toUpperCase(), currentStatus);
    
    res.json({
      success: true,
      data: complianceCheck,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error checking compliance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check compliance',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/compliance/tax/:countryCode
 * Get tax configuration for a country
 */
router.get('/tax/:countryCode', (req, res) => {
  try {
    const { countryCode } = req.params;
    const { amount, region } = req.query;
    
    const taxConfig = getTaxConfig(countryCode.toUpperCase());
    
    if (!taxConfig) {
      return res.status(404).json({
        success: false,
        error: `Tax configuration not found for ${countryCode}`,
        timestamp: new Date().toISOString()
      });
    }
    
    let calculation = null;
    if (amount) {
      calculation = calculateTax(parseFloat(amount), countryCode.toUpperCase(), region);
    }
    
    res.json({
      success: true,
      data: {
        countryCode: countryCode.toUpperCase(),
        config: taxConfig,
        calculation,
        taxIdRequired: isTaxIdRequired(countryCode.toUpperCase()),
        taxIdName: getTaxIdName(countryCode.toUpperCase())
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching tax configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tax configuration',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
