export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, business, email, website, phone, industry, teamSize, challenge, referral, notes, recaptchaToken } = req.body;

  // Validate reCAPTCHA
  try {
    const verify = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`,
      { method: 'POST' }
    );
    const verifyData = await verify.json();
    if (!verifyData.success) {
      console.error('reCAPTCHA verification failed:', verifyData['error-codes']);
      return res.status(400).json({ success: false, error: 'reCAPTCHA verification failed' });
    }
  } catch (err) {
    console.error('reCAPTCHA request error:', err);
    return res.status(500).json({ success: false, error: 'reCAPTCHA check failed' });
  }

  const description = `Business Name: ${business}
Email: ${email}
Website: ${website}
Phone: ${phone}
Industry: ${industry}
Team Size: ${teamSize}
Biggest Challenge: ${challenge}
How They Heard About Us: ${referral}
Additional Notes: ${notes}`;

  const emailBody = `New intake form submission:\n\nName: ${name}\nBusiness: ${business}\nEmail: ${email}\nWebsite: ${website}\nPhone: ${phone}\nIndustry: ${industry}\nTeam Size: ${teamSize}\nBiggest Challenge: ${challenge}\nHow They Heard About Us: ${referral}\nAdditional Notes: ${notes}`;

  // Send email via Resend (primary — must succeed)
  try {
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'ContinuityOS <onboarding@resend.dev>',
        to: 'tara@brand-love.ca',
        subject: `New discovery call request from ${name} — ${business}`,
        text: emailBody
      })
    });

    if (!emailRes.ok) {
      const errorText = await emailRes.text();
      console.error('Resend email failed:', emailRes.status, errorText);
      return res.status(500).json({ success: false, error: 'Failed to send email notification' });
    }
  } catch (err) {
    console.error('Resend request error:', err);
    return res.status(500).json({ success: false, error: 'Failed to send email notification' });
  }

  // Create ClickUp task (secondary — log failure but don't block success)
  try {
    const clickupRes = await fetch('https://api.clickup.com/api/v2/list/901711764923/task', {
      method: 'POST',
      headers: {
        'Authorization': process.env.CLICKUP_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `${name} — ${business}`,
        description
      })
    });

    if (!clickupRes.ok) {
      const errorText = await clickupRes.text();
      console.error('ClickUp task creation failed:', clickupRes.status, errorText);
    }
  } catch (err) {
    console.error('ClickUp request error:', err);
  }

  res.status(200).json({ success: true });
}
