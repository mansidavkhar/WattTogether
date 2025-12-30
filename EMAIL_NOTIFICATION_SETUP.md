# Email Notification Setup

## Installation

Install nodemailer in the backend:

```bash
cd backend
npm install nodemailer
```

## Configuration

Add these environment variables to your `.env` file:

```env
# Email Configuration (Optional - for milestone notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
FRONTEND_URL=http://localhost:5173
```

### Gmail Setup

If using Gmail:
1. Go to Google Account settings
2. Enable 2-Factor Authentication
3. Generate an App Password: https://myaccount.google.com/apppasswords
4. Use the app password (not your Gmail password) as `EMAIL_PASSWORD`

### Other Email Providers

For other providers (SendGrid, Mailgun, etc.), use their SMTP settings:

**SendGrid:**
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

**Mailgun:**
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=your-mailgun-username
EMAIL_PASSWORD=your-mailgun-password
```

## Features

When a creator creates a new milestone:
- ✅ All campaign donors receive an email notification
- ✅ Email includes milestone amount and description
- ✅ Contains a direct link to vote on the milestone
- ✅ Works automatically when configured
- ✅ Gracefully degrades if not configured (milestone creation still works)

## My Investments Page Indicator

The My Investments page now shows:
- 🔴 **"Vote Now!"** badge on campaigns with pending milestones that need your vote
- Only appears for campaigns you've donated to
- Disappears once you've voted on all pending milestones

## Testing

1. Install nodemailer: `npm install nodemailer`
2. Configure email credentials in `.env`
3. Restart backend server
4. Create a new milestone as a campaign creator
5. Check donor's email inbox for notification
6. Check My Investments page for "Vote Now!" indicator

## Troubleshooting

**Emails not sending?**
- Check `.env` file has correct credentials
- Verify backend console for email logs
- Ensure firewall allows SMTP connections
- Test with a different email provider

**No configuration?**
- The system will log intended recipients but won't fail
- Milestone creation works normally without email
- Configure later when ready
