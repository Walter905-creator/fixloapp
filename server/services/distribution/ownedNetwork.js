/**
 * Owned Authority Network System
 * 
 * Prepares content for publication to owned domains.
 * NO AUTOMATION of logins or publishing - config and export only.
 */

const fs = require('fs');
const path = require('path');
const { OWNED_NETWORK } = require('./config');
const logger = require('./logger');

class OwnedNetwork {
  constructor() {
    this.outputDirectory = OWNED_NETWORK.outputDirectory;
    
    // Ensure output directory exists
    if (OWNED_NETWORK.enabled && !fs.existsSync(this.outputDirectory)) {
      fs.mkdirSync(this.outputDirectory, { recursive: true });
    }
  }
  
  /**
   * Export content as Markdown
   */
  exportAsMarkdown(pageContent) {
    const { title, description, intro, sections, faq, service, location } = pageContent;
    
    let markdown = `# ${title}\n\n`;
    markdown += `${description}\n\n`;
    markdown += `---\n\n`;
    markdown += `${intro}\n\n`;
    
    // Add sections
    for (const section of sections) {
      markdown += `## ${section.heading}\n\n`;
      markdown += `${section.body}\n\n`;
    }
    
    // Add FAQ section
    if (faq && faq.length > 0) {
      markdown += `## Frequently Asked Questions\n\n`;
      
      for (const item of faq) {
        markdown += `### ${item.question}\n\n`;
        markdown += `${item.answer}\n\n`;
      }
    }
    
    // Add footer with CTA
    markdown += `---\n\n`;
    markdown += `**Ready to get started?** [Find ${service} professionals in ${location} on Fixlo](https://www.fixloapp.com)\n`;
    
    return markdown;
  }
  
  /**
   * Export content as HTML
   */
  exportAsHTML(pageContent) {
    const { title, description, intro, sections, faq, service, location } = pageContent;
    
    let html = `<!DOCTYPE html>\n`;
    html += `<html lang="en">\n`;
    html += `<head>\n`;
    html += `  <meta charset="UTF-8">\n`;
    html += `  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n`;
    html += `  <meta name="description" content="${this.escapeHtml(description)}">\n`;
    html += `  <title>${this.escapeHtml(title)}</title>\n`;
    html += `  <style>\n`;
    html += `    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }\n`;
    html += `    h1 { color: #2563eb; }\n`;
    html += `    h2 { color: #1e40af; margin-top: 30px; }\n`;
    html += `    h3 { color: #1e3a8a; margin-top: 20px; }\n`;
    html += `    .cta { background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 30px; }\n`;
    html += `  </style>\n`;
    html += `</head>\n`;
    html += `<body>\n`;
    html += `  <h1>${this.escapeHtml(title)}</h1>\n`;
    html += `  <p><strong>${this.escapeHtml(description)}</strong></p>\n`;
    html += `  <hr>\n`;
    html += `  <p>${this.escapeHtml(intro)}</p>\n`;
    
    // Add sections
    for (const section of sections) {
      html += `  <h2>${this.escapeHtml(section.heading)}</h2>\n`;
      html += `  <p>${this.escapeHtml(section.body)}</p>\n`;
    }
    
    // Add FAQ section
    if (faq && faq.length > 0) {
      html += `  <h2>Frequently Asked Questions</h2>\n`;
      
      for (const item of faq) {
        html += `  <h3>${this.escapeHtml(item.question)}</h3>\n`;
        html += `  <p>${this.escapeHtml(item.answer)}</p>\n`;
      }
    }
    
    // Add footer with CTA
    html += `  <hr>\n`;
    html += `  <a href="https://www.fixloapp.com" class="cta">Find ${this.escapeHtml(service)} professionals in ${this.escapeHtml(location)} on Fixlo</a>\n`;
    html += `</body>\n`;
    html += `</html>`;
    
    return html;
  }
  
  /**
   * Escape HTML special characters
   */
  escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  /**
   * Generate filename from page content
   */
  generateFilename(pageContent, format = 'markdown') {
    const { service, location } = pageContent;
    const slug = `${service}-${location}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const ext = format === 'markdown' ? 'md' : 'html';
    return `${slug}.${ext}`;
  }
  
  /**
   * Export page content in specified formats
   */
  exportPage(pageContent, formats = OWNED_NETWORK.exportFormats) {
    if (!OWNED_NETWORK.enabled) {
      logger.debug('Owned network is disabled');
      return null;
    }
    
    const exports = {};
    
    try {
      for (const format of formats) {
        let content;
        
        if (format === 'markdown') {
          content = this.exportAsMarkdown(pageContent);
        } else if (format === 'html') {
          content = this.exportAsHTML(pageContent);
        } else {
          logger.warn('Unknown export format', { format });
          continue;
        }
        
        const filename = this.generateFilename(pageContent, format);
        const filepath = path.join(this.outputDirectory, filename);
        
        fs.writeFileSync(filepath, content, 'utf8');
        
        exports[format] = filepath;
        
        logger.info('Content exported', { 
          format,
          filepath,
          service: pageContent.service,
          location: pageContent.location,
        });
      }
      
      return exports;
      
    } catch (error) {
      logger.error('Content export failed', { error: error.message });
      return null;
    }
  }
  
  /**
   * Generate publishing manifest
   */
  generateManifest(pages) {
    if (!OWNED_NETWORK.enabled) return null;
    
    const manifest = {
      generatedAt: new Date().toISOString(),
      domains: OWNED_NETWORK.domains,
      manualPublishOnly: OWNED_NETWORK.manualPublishOnly,
      pages: [],
    };
    
    for (const page of pages) {
      manifest.pages.push({
        title: page.title,
        service: page.service,
        location: page.location,
        exports: this.exportPage(page),
        suggestedDomains: this.suggestDomains(page),
      });
    }
    
    // Save manifest
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const manifestPath = path.join(this.outputDirectory, `manifest-${timestamp}.json`);
    
    try {
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
      
      logger.info('Publishing manifest generated', { 
        manifestPath,
        pageCount: pages.length,
      });
      
      return manifestPath;
    } catch (error) {
      logger.error('Failed to save manifest', { error: error.message });
      return null;
    }
  }
  
  /**
   * Suggest appropriate domains for content
   */
  suggestDomains(page) {
    if (OWNED_NETWORK.domains.length === 0) {
      return [];
    }
    
    // Simple suggestion logic - can be enhanced
    // For now, just return all configured domains
    return OWNED_NETWORK.domains;
  }
  
  /**
   * Validate that manual publishing is enforced
   */
  validateManualOnly() {
    if (!OWNED_NETWORK.manualPublishOnly) {
      logger.logSafetyGuardrail('auto_publish_detected', 'prevented');
      throw new Error('SAFETY VIOLATION: Automatic publishing is not allowed');
    }
    
    return true;
  }
  
  /**
   * Generate API publishing payload (for manual use with publishing APIs)
   */
  generateAPIPayload(pageContent, targetDomain) {
    if (!OWNED_NETWORK.enabled) return null;
    
    this.validateManualOnly();
    
    return {
      generatedAt: new Date().toISOString(),
      targetDomain,
      manualApprovalRequired: true,
      autoPublish: false, // ALWAYS false
      content: {
        title: pageContent.title,
        description: pageContent.description,
        body: this.exportAsHTML(pageContent),
        metadata: {
          service: pageContent.service,
          location: pageContent.location,
          language: pageContent.language,
        },
      },
      instructions: 'This payload is for manual or API-based publishing only. Review content before publishing.',
    };
  }
  
  /**
   * Get owned network status
   */
  getStatus() {
    return {
      enabled: OWNED_NETWORK.enabled,
      domains: OWNED_NETWORK.domains,
      domainsConfigured: OWNED_NETWORK.domains.length,
      manualPublishOnly: OWNED_NETWORK.manualPublishOnly,
      outputDirectory: this.outputDirectory,
      exportFormats: OWNED_NETWORK.exportFormats,
      filesExported: this.countExportedFiles(),
    };
  }
  
  /**
   * Count exported files
   */
  countExportedFiles() {
    if (!fs.existsSync(this.outputDirectory)) return 0;
    
    try {
      const files = fs.readdirSync(this.outputDirectory);
      return files.filter(f => f.endsWith('.md') || f.endsWith('.html')).length;
    } catch (error) {
      return 0;
    }
  }
}

module.exports = new OwnedNetwork();
