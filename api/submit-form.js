export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, business, email, website, phone, industry, teamSize, challenge, referral, notes } = req.body;

  const response = await fetch('https://api.clickup.com/api/v2/list/901711764923/task', {
    method: 'POST',
    headers: {
      'Authorization': process.env.CLICKUP_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: name,
      description: `Business Name: ${business}\nEmail: ${email}\nWebsite: ${website}\nPhone: ${phone}\nIndustry: ${industry}\nTeam Size: ${teamSize}\nBiggest Challenge: ${challenge}\nHow They Heard About Us: ${referral}\nAdditional Notes: ${notes}`
    })
  });

  if (response.ok) {
    res.status(200).json({ success: true });
  } else {
    const error = await response.text();
    res.status(500).json({ success: false, error });
  }
}
