// Email notification service
// Note: Install nodemailer with: npm install nodemailer
// Configure environment variables: EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD

/**
 * Send email notification to campaign donors about new milestone
 */
const sendMilestoneNotification = async (donorEmails, campaignTitle, milestoneDescription, milestoneAmount) => {
  try {
    // Check if nodemailer is available
    let nodemailer;
    try {
      nodemailer = require('nodemailer');
    } catch (err) {
      console.warn('⚠️ Nodemailer not installed. Email notifications disabled.');
      console.log('📧 Would have sent email to:', donorEmails.length, 'donors');
      return { success: true, message: 'Email service not configured', sent: 0 };
    }

    // Check email configuration
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
      console.warn('⚠️ Email credentials not configured. Skipping email notification.');
      console.log('📧 Would notify:', donorEmails);
      return { success: true, message: 'Email credentials not configured', sent: 0 };
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Email template
    const mailOptions = {
      from: `"WattTogether" <${process.env.EMAIL_USER}>`,
      bcc: donorEmails, // Send to all donors as BCC
      subject: `New Milestone Created - ${campaignTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #134B70 0%, #508C9B 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .milestone-box { background: white; padding: 20px; border-left: 4px solid #508C9B; margin: 20px 0; border-radius: 4px; }
            .amount { font-size: 24px; font-weight: bold; color: #134B70; }
            .button { display: inline-block; background: linear-gradient(135deg, #134B70 0%, #508C9B 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 New Milestone - Please Vote!</h1>
            </div>
            <div class="content">
              <p>Hello valued backer,</p>
              <p>A new milestone has been created for <strong>${campaignTitle}</strong>, a campaign you have supported.</p>
              
              <div class="milestone-box">
                <p class="amount">₹${parseInt(milestoneAmount).toLocaleString()}</p>
                <p><strong>Description:</strong></p>
                <p>${milestoneDescription}</p>
              </div>

              <p>As a backer of this campaign, you have voting power to approve or reject this milestone. Your vote helps ensure transparent and accountable use of funds.</p>
              
              <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="button">Vote Now →</a>
              </p>

              <p><strong>Why your vote matters:</strong></p>
              <ul>
                <li>Milestones need >50% approval to release funds</li>
                <li>You can review proof documents before voting</li>
                <li>Your participation ensures project accountability</li>
              </ul>

              <p>Thank you for supporting sustainable energy projects!</p>
              <p>- The WattTogether Team</p>
            </div>
            <div class="footer">
              <p>You received this email because you backed a campaign on WattTogether.</p>
              <p>&copy; ${new Date().getFullYear()} WattTogether. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
New Milestone Created - ${campaignTitle}

A new milestone has been created for ${campaignTitle}, a campaign you have supported.

Milestone Amount: ₹${parseInt(milestoneAmount).toLocaleString()}
Description: ${milestoneDescription}

As a backer of this campaign, you have voting power to approve or reject this milestone.

Please visit WattTogether to review the milestone and cast your vote.

- The WattTogether Team
      `,
    };

    // Send email
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email notification sent:', info.messageId);
      console.log('📧 Notified', donorEmails.length, 'donors');

      return {
        success: true,
        messageId: info.messageId,
        sent: donorEmails.length
      };
    } catch (sendError) {
      // Handle authentication errors gracefully
      if (sendError.code === 'EAUTH') {
        console.warn('\n⚠️ ═══════════════════════════════════════════════════════════════');
        console.warn('⚠️  EMAIL AUTHENTICATION FAILED - Email notifications disabled');
        console.warn('⚠️ ═══════════════════════════════════════════════════════════════');
        console.warn('⚠️  Gmail requires App Passwords (not your regular password)');
        console.warn('⚠️  To enable email notifications:');
        console.warn('⚠️  ');
        console.warn('⚠️  1. Go to: https://myaccount.google.com/apppasswords');
        console.warn('⚠️  2. Create a new App Password (select "Mail" and "Other")');
        console.warn('⚠️  3. Update .env file: EMAIL_PASSWORD=<16-char-app-password>');
        console.warn('⚠️  4. Restart backend server');
        console.warn('⚠️  ');
        console.warn('⚠️  For now, milestone notifications will be skipped.');
        console.warn('⚠️ ═══════════════════════════════════════════════════════════════\n');
        
        return {
          success: true, // Don't fail the milestone creation
          message: 'Email authentication not configured. Notifications skipped.',
          sent: 0
        };
      }
      
      // Other email errors
      console.error('❌ Email send error:', sendError.message);
      return {
        success: true, // Don't fail the milestone creation
        message: 'Email failed but milestone created successfully',
        error: sendError.message,
        sent: 0
      };
    }

  } catch (error) {
    console.error('❌ Email notification error:', error);
    return {
      success: true, // Don't fail the milestone creation
      message: 'Email service error. Notifications skipped.',
      error: error.message,
      sent: 0
    };
  }
};

module.exports = {
  sendMilestoneNotification
};
