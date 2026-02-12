import { Router, Request, Response } from "express";

const router = Router();

// Email templates (same as frontend, but stored on backend)
const emailTemplates: Record<string, { subject: string; html: string }> = {
  creator_application_received: {
    subject: "Visual Matters - Application Received",
    html: `
      <h2>Thank you for applying!</h2>
      <p>We've received your creator application and will review it shortly.</p>
      <p>You'll receive an email update within 2-3 business days.</p>
      <p>Best regards,<br/>The Visual Matters Team</p>
    `,
  },
  creator_application_approved: {
    subject: "Visual Matters - Your Application Has Been Approved!",
    html: `
      <h2>Congratulations!</h2>
      <p>Your creator application has been approved. You can now log in and complete your profile.</p>
      <p><a href="{{login_url}}">Click here to log in</a></p>
      <p>Best regards,<br/>The Visual Matters Team</p>
    `,
  },
  creator_application_rejected: {
    subject: "Visual Matters - Application Update",
    html: `
      <h2>Application Review</h2>
      <p>Thank you for your interest in becoming a Visual Matters creator.</p>
      <p>After reviewing your application, we've decided to move forward with other candidates at this time.</p>
      <p>Feedback: {{review_notes}}</p>
      <p>We encourage you to apply again in the future.</p>
      <p>Best regards,<br/>The Visual Matters Team</p>
    `,
  },
  project_created: {
    subject: "Visual Matters - New Project Ready for Creators",
    html: `
      <h2>New Project Available</h2>
      <p>A new project matching your skills is now available!</p>
      <p>Project: {{project_title}}</p>
      <p>Budget: BUDGET_{{budget_amount}}</p>
      <p><a href="{{project_url}}">View Project</a></p>
      <p>Best regards,<br/>The Visual Matters Team</p>
    `,
  },
  project_assigned: {
    subject: "Visual Matters - You've Been Assigned to a Project",
    html: `
      <h2>Project Assignment</h2>
      <p>You've been assigned to: {{project_title}}</p>
      <p>Role: {{role}}</p>
      <p><a href="{{project_url}}">View Project Details</a></p>
      <p>Best regards,<br/>The Visual Matters Team</p>
    `,
  },
  deliverable_submitted: {
    subject: "Visual Matters - Deliverable Submitted",
    html: `
      <h2>Deliverable Received</h2>
      <p>A deliverable has been submitted for: {{project_title}}</p>
      <p>Milestone: {{milestone_title}}</p>
      <p>Creator: {{creator_name}}</p>
      <p><a href="{{review_url}}">Review Deliverable</a></p>
      <p>Best regards,<br/>The Visual Matters Team</p>
    `,
  },
  payment_processed: {
    subject: "Visual Matters - Payment Confirmed",
    html: `
      <h2>Payment Processed</h2>
      <p>Your payment has been successfully processed.</p>
      <p>Amount: AMOUNT_{{amount}}</p>
      <p>Project: {{project_title}}</p>
      <p>Transaction ID: {{transaction_id}}</p>
      <p>Best regards,<br/>The Visual Matters Team</p>
    `,
  },
};

// Helper to replace template variables
function replaceVariables(
  template: string,
  variables: Record<string, any>
): string {
  let result = template;

  // Replace all template variables
  Object.entries(variables).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      // Replace {{variable}} with the actual value
      result = result.replace(new RegExp(`{{${key}}}`, "g"), String(value));
    }
  });

  // Clean up any remaining unreplaced variables
  result = result.replace(/{{[^}]+}}/g, "");

  return result;
}

// POST /api/send-email
// Requires: SENDGRID_API_KEY environment variable
// Body: { to: string, templateName: string, variables: Record<string, any> }
router.post("/send-email", async (req: Request, res: Response) => {
  try {
    const { to, templateName, variables = {} } = req.body;

    // Validate request
    if (!to || !templateName) {
      return res.status(400).json({
        error: "Missing required fields: to, templateName",
      });
    }

    // Get template
    const template = emailTemplates[templateName];
    if (!template) {
      return res.status(400).json({
        error: `Unknown template: ${templateName}`,
      });
    }

    // Replace variables in template
    const subject = replaceVariables(template.subject, variables);
    const html = replaceVariables(template.html, variables);

    // Send email via SendGrid
    const sendGridApiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.FROM_EMAIL || "noreply@visualmatters.co";

    if (!sendGridApiKey) {
      console.warn("SENDGRID_API_KEY not configured - email not sent");
      // Return success anyway for development
      return res.json({
        success: true,
        message: "Email would be sent (SendGrid not configured)",
      });
    }

    // Import SendGrid dynamically
    const sgMail = require("@sendgrid/mail");
    sgMail.setApiKey(sendGridApiKey);

    const msg = {
      to,
      from: fromEmail,
      subject,
      html,
    };

    await sgMail.send(msg);

    return res.json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("Email send error:", error);

    // In development, don't expose SendGrid errors
    if (process.env.NODE_ENV === "development") {
      return res.status(500).json({
        error: `Email send failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }

    return res.status(500).json({
      error: "Failed to send email",
    });
  }
});

export default router;
