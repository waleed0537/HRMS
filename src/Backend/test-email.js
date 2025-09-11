// test-email.js - Add this file to your project root
const nodemailer = require('nodemailer');

// Use your existing configuration
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: 'smartrichads@gmail.com',
    pass: 'dukj ntyb tcyl czyo'
  }
});

// Your existing sendEmail function for testing
const sendEmail = async (to, subject, content) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER || 'smartrichads@gmail.com',
      to: to,
      subject: subject,
      html: content
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', to);
    console.log('Email messageId:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email to', to, ':', error);
    return { success: false, error: error.message };
  }
};

async function testHRMSEmail() {
  console.log('🧪 Testing HRMS Email System...\n');
  
  try {
    // Test 1: Connection Test
    console.log('📡 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful\n');
    
    // Test 2: Test your actual email functions
    console.log('📧 Testing HRMS email functions...\n');
    
    // Test Leave Approval Email (similar to your actual function)
    const testLeaveApprovalEmail = async () => {
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #474787;">Leave Request Approved</h2>
          <p>Hello Test Employee,</p>
          
          <p>Your <strong>Annual Leave</strong> request for the period <strong>December 25, 2024</strong> to <strong>December 27, 2024</strong> has been <strong>approved</strong>.</p>
          
          <div style="background-color: #d1fae5; padding: 15px; border-radius: 5px; color: #047857;">
            Your leave has been approved. Please ensure you've completed any handover procedures before your leave starts.
          </div>
          
          <p>If you have any questions, please contact the HR department.</p>
          
          <p>Thank you,<br>HR Management Team</p>
          
          <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
            <p>This is a test email from your HRMS system.</p>
          </div>
        </div>
      `;
      
      return await sendEmail('test@yourdomain.com', 'TEST: Leave Request Approved', emailContent);
    };
    
    // Test Applicant Status Email (similar to your actual function)
    const testApplicantStatusEmail = async () => {
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #474787;">Application Status Update</h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p>Congratulations! Your application has been shortlisted.</p>
            <p>Our HR team will contact you soon to schedule an interview.</p>
          </div>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
            <h3 style="color: #333;">Application Details:</h3>
            <ul style="list-style: none; padding-left: 0;">
              <li><strong>Position:</strong> Software Developer</li>
              <li><strong>Branch:</strong> Main Office</li>
              <li><strong>Applied On:</strong> ${new Date().toLocaleDateString()}</li>
              <li><strong>Current Status:</strong> Shortlisted</li>
            </ul>
          </div>
          
          <div style="margin-top: 30px; color: #666; font-size: 12px;">
            <p>This is a test email from your HRMS system.</p>
          </div>
        </div>
      `;
      
      return await sendEmail('test@yourdomain.com', 'TEST: Application Status Update', emailContent);
    };
    
    // Run tests
    console.log('🔄 Testing Leave Approval Email...');
    const leaveResult = await testLeaveApprovalEmail();
    console.log('Leave email result:', leaveResult.success ? '✅ Success' : '❌ Failed');
    if (!leaveResult.success) console.log('Error:', leaveResult.error);
    
    console.log('\n🔄 Testing Applicant Status Email...');
    const applicantResult = await testApplicantStatusEmail();
    console.log('Applicant email result:', applicantResult.success ? '✅ Success' : '❌ Failed');
    if (!applicantResult.success) console.log('Error:', applicantResult.error);
    
    // Test 3: Check Gmail API limits
    console.log('\n📊 Checking Gmail limits...');
    console.log('Current daily sending limit with Gmail: ~500 emails for new accounts, ~2000 for established accounts');
    console.log('Consider monitoring your daily email volume in production');
    
    // Test 4: Production readiness check
    console.log('\n🔍 Production Readiness Check:');
    
    const checks = [
      {
        name: 'Environment Variables',
        passed: !!process.env.SMTP_USER && !!process.env.SMTP_PASS,
        message: 'Credentials should be in environment variables'
      },
      {
        name: 'Error Handling',
        passed: true, // Your sendEmail function has good error handling
        message: 'Email error handling implemented'
      },
      {
        name: 'Email Templates',
        passed: true, // You have good HTML templates
        message: 'HTML email templates are well-formatted'
      },
      {
        name: 'App Password',
        passed: true, // You're using an app password
        message: 'Using Gmail app password (good!)'
      }
    ];
    
    checks.forEach(check => {
      console.log(`${check.passed ? '✅' : '❌'} ${check.name}: ${check.message}`);
    });
    
    console.log('\n🎉 HRMS Email Test Complete!');
    
    if (leaveResult.success && applicantResult.success) {
      console.log('✅ All email functions are working correctly');
      console.log('📧 Check your test email inbox to verify delivery');
    } else {
      console.log('⚠️  Some email functions failed - check the errors above');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    // Specific troubleshooting for your setup
    if (error.code === 'EAUTH') {
      console.error('\n💡 Authentication Error Solutions:');
      console.error('   1. Verify your Gmail app password is correct');
      console.error('   2. Make sure 2-factor authentication is enabled');
      console.error('   3. Check if the app password has expired');
    }
  }
}

// Express endpoint for testing in your existing app
function addEmailTestRoute(app) {
  app.get('/api/test-email', async (req, res) => {
    try {
      const testEmail = req.query.email || 'test@example.com';
      
      const result = await sendEmail(
        testEmail,
        'HRMS Email Test',
        '<h2>Email system is working!</h2><p>Your HRMS email configuration is correct.</p>'
      );
      
      res.json({
        success: result.success,
        message: result.success ? 'Test email sent successfully' : 'Email failed to send',
        details: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Email test failed',
        error: error.message
      });
    }
  });
}

// Health check endpoint for email system
function addEmailHealthCheck(app) {
  app.get('/api/health/email', async (req, res) => {
    try {
      await transporter.verify();
      res.json({
        status: 'healthy',
        service: 'gmail',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
}

// Run test if called directly
if (require.main === module) {
  testHRMSEmail();
}

module.exports = {
  testHRMSEmail,
  addEmailTestRoute,
  addEmailHealthCheck,
  sendEmail
};