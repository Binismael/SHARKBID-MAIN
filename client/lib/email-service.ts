// Email Service for sending transactional emails
// This can integrate with SendGrid, Mailgun, or other email providers

interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
}

const emailTemplates: Record<string, EmailTemplate> = {
  creator_application_received: {
    name: "Vendor Application Received",
    subject: "Sharkbid - Application Received",
    html: `
      <h2>Thank you for applying!</h2>
      <p>We've received your creator application and will review it shortly.</p>
      <p>You'll receive an email update within 2-3 business days.</p>
      <p>Best regards,<br/>The Sharkbid Team</p>
    `,
  },
  creator_application_approved: {
    name: "Vendor Application Approved",
    subject: "Sharkbid - Your Application Has Been Approved!",
    html: `
      <h2>Congratulations!</h2>
      <p>Your creator application has been approved. You can now log in and complete your profile.</p>
      <p><a href="{{login_url}}">Click here to log in</a></p>
      <p>Best regards,<br/>The Sharkbid Team</p>
    `,
  },
  creator_application_rejected: {
    name: "Vendor Application Decision",
    subject: "Sharkbid - Application Update",
    html: `
      <h2>Application Review</h2>
      <p>Thank you for your interest in becoming a Sharkbid creator.</p>
      <p>After reviewing your application, we've decided to move forward with other candidates at this time.</p>
      <p>Feedback: {{review_notes}}</p>
      <p>We encourage you to apply again in the future.</p>
      <p>Best regards,<br/>The Sharkbid Team</p>
    `,
  },
  project_created: {
    name: "New Project Created",
    subject: "Sharkbid - New Project Ready for Vendors",
    html: `
      <h2>New Project Available</h2>
      <p>A new project matching your skills is now available!</p>
      <p>Project: {{project_title}}</p>
      <p>Budget: BUDGET_{{budget_amount}}</p>
      <p><a href="{{project_url}}">View Project</a></p>
      <p>Best regards,<br/>The Sharkbid Team</p>
    `,
  },
  project_assigned: {
    name: "Project Assigned",
    subject: "Sharkbid - You've Been Assigned to a Project",
    html: `
      <h2>Project Assignment</h2>
      <p>You've been assigned to: {{project_title}}</p>
      <p>Role: {{role}}</p>
      <p><a href="{{project_url}}">View Project Details</a></p>
      <p>Best regards,<br/>The Sharkbid Team</p>
    `,
  },
  deliverable_submitted: {
    name: "Deliverable Submitted",
    subject: "Sharkbid - Deliverable Submitted",
    html: `
      <h2>Deliverable Received</h2>
      <p>A deliverable has been submitted for: {{project_title}}</p>
      <p>Milestone: {{milestone_title}}</p>
      <p>Creator: {{creator_name}}</p>
      <p><a href="{{review_url}}">Review Deliverable</a></p>
      <p>Best regards,<br/>The Sharkbid Team</p>
    `,
  },
  payment_processed: {
    name: "Payment Processed",
    subject: "Sharkbid - Payment Confirmed",
    html: `
      <h2>Payment Processed</h2>
      <p>Your payment has been successfully processed.</p>
      <p>Amount: AMOUNT_{{amount}}</p>
      <p>Project: {{project_title}}</p>
      <p>Transaction ID: {{transaction_id}}</p>
      <p>Best regards,<br/>The Sharkbid Team</p>
    `,
  },
};

// Send email function - calls backend endpoint
export async function sendEmail(
  to: string,
  templateName: string,
  variables: Record<string, any> = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate email
    if (!to || !templateName) {
      return {
        success: false,
        error: "Missing email or template",
      };
    }

    // In production, this would call a secure backend endpoint
    // that handles the actual email sending through SendGrid/Mailgun
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to,
        templateName,
        variables: {
          ...variables,
          // Ensure standard variables exist
          DOLLAR: "$",
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to send email",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Email send error:", error);
    return {
      success: false,
      error: "Failed to send email",
    };
  }
}

// Send creator application notification
export async function sendCreatorApplicationEmail(
  email: string,
  name: string,
  status: "received" | "approved" | "rejected",
  reviewNotes?: string
) {
  const templates: Record<string, string> = {
    received: "creator_application_received",
    approved: "creator_application_approved",
    rejected: "creator_application_rejected",
  };

  return sendEmail(email, templates[status], {
    name,
    login_url: `${window.location.origin}/login`,
    review_notes: reviewNotes,
  });
}

// Send project notification to creator
export async function sendProjectNotificationEmail(
  email: string,
  projectTitle: string,
  budget: number,
  projectId: string
) {
  return sendEmail(email, "project_created", {
    project_title: projectTitle,
    budget_amount: budget.toLocaleString(),
    project_url: `${window.location.origin}/creator/projects/${projectId}`,
  });
}

// Send project assignment notification
export async function sendProjectAssignmentEmail(
  email: string,
  projectTitle: string,
  role: string,
  projectId: string
) {
  return sendEmail(email, "project_assigned", {
    project_title: projectTitle,
    role,
    project_url: `${window.location.origin}/creator/projects/${projectId}`,
  });
}

// Send deliverable submission notification
export async function sendDeliverableNotificationEmail(
  email: string,
  projectTitle: string,
  milestoneTitle: string,
  creatorName: string,
  deliverableId: string
) {
  return sendEmail(email, "deliverable_submitted", {
    project_title: projectTitle,
    milestone_title: milestoneTitle,
    creator_name: creatorName,
    review_url: `${window.location.origin}/client/deliverables/${deliverableId}`,
  });
}

// Send payment confirmation email
export async function sendPaymentConfirmationEmail(
  email: string,
  amount: number,
  projectTitle: string,
  transactionId: string
) {
  return sendEmail(email, "payment_processed", {
    amount: `$${amount.toLocaleString()}`,
    project_title: projectTitle,
    transaction_id: transactionId,
  });
}

// Get email template for preview (admin)
export function getEmailTemplate(templateName: string): EmailTemplate | null {
  return emailTemplates[templateName] || null;
}

// Get all available templates (admin)
export function getAllEmailTemplates(): string[] {
  return Object.keys(emailTemplates);
}
