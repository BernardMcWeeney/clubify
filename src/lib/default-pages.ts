/**
 * Default page templates for new clubs
 * These pages are automatically created when a club is set up
 */

interface PageTemplate {
  title: string;
  slug: string;
  content: string;
  is_published: number;
}

export function getDefaultPages(clubName: string, clubEmail?: string): PageTemplate[] {
  return [
    {
      title: 'Home',
      slug: 'home',
      content: `# Welcome to ${clubName}

We are a proud GAA club dedicated to promoting Gaelic games and fostering community spirit.

*This is your homepage content. You can customize it in the admin portal under Pages.*`,
      is_published: 1,
    },
    {
      title: 'About Us',
      slug: 'about',
      content: `# About ${clubName}

Welcome to ${clubName}! We are a proud GAA club committed to promoting Gaelic games and culture in our community.

## Our Club

${clubName} has a rich history of sporting excellence and community spirit. We field teams across all age groups and grades, from our youngest members in our nursery program to our senior teams competing at the highest levels.

## What We Offer

- **Youth Development**: Comprehensive programs for children from age 4 upwards
- **Adult Teams**: Competitive teams for men and women across all grades
- **Coaching**: Qualified coaches committed to player development
- **Facilities**: Modern facilities for training and matches
- **Community**: A welcoming environment for players, families, and supporters

## Get Involved

Whether you're looking to play, coach, volunteer, or support, there are many ways to get involved with ${clubName}. Visit our [Contact](/contact) page to get in touch.

*This page can be edited in your admin portal under Pages.*`,
      is_published: 1,
    },
    {
      title: 'Contact Us',
      slug: 'contact',
      content: `# Contact ${clubName}

We'd love to hear from you! Whether you're interested in joining the club, volunteering, or have a general enquiry, please get in touch.

## Contact Information

${clubEmail ? `**Email**: ${clubEmail}` : '*Club email will be displayed here once set in settings*'}

## Send Us a Message

Use the contact form below to send us a message and we'll get back to you as soon as possible.

*The contact form will appear here automatically when the Inbox module is enabled.*`,
      is_published: 1,
    },
    {
      title: 'Committee',
      slug: 'committee',
      content: `# ${clubName} Committee

Our club is managed by a dedicated committee of volunteers who work tirelessly to ensure the success and smooth operation of ${clubName}.

## Executive Committee

### Chairperson
**Name**: *To be added*
**Email**: *chairperson@example.com*

### Vice-Chairperson
**Name**: *To be added*

### Secretary
**Name**: *To be added*
**Email**: *secretary@example.com*

### Treasurer
**Name**: *To be added*

### PRO (Public Relations Officer)
**Name**: *To be added*

### Registrar
**Name**: *To be added*

## Team Management

### Senior Team Manager
**Name**: *To be added*

### U21 Manager
**Name**: *To be added*

### Juvenile Coordinator
**Name**: *To be added*

## Other Roles

- **Child Safeguarding Officer**: *To be added*
- **Facilities Manager**: *To be added*
- **Fundraising Coordinator**: *To be added*

---

*Want to get involved? Contact us at ${clubEmail || '[Club Email]'}*`,
      is_published: 1,
    },
    {
      title: 'Sponsors',
      slug: 'sponsors',
      content: `# Our Sponsors

${clubName} is grateful for the generous support of our sponsors. Their contributions help us provide excellent facilities, equipment, and opportunities for all our members.

## Premium Sponsors

*Premium sponsor logos and information will appear here*

## Club Sponsors

*Club sponsor logos and information will appear here*

## Supporting Sponsors

*Supporting sponsor logos and information will appear here*

---

## Become a Sponsor

Interested in supporting ${clubName}? We offer various sponsorship packages to suit different budgets and requirements.

**Benefits of sponsorship:**
- Logo placement on club website
- Recognition at club events
- Social media promotion
- Community engagement opportunities

Contact us at ${clubEmail || '[Club Email]'} to discuss sponsorship opportunities.

*You can manage your sponsors in the admin portal under the Sponsors module.*`,
      is_published: 1,
    },
    {
      title: 'Fixtures',
      slug: 'fixtures',
      content: `# Fixtures

## Upcoming Matches

*Upcoming fixtures will automatically appear here from your Fixtures module.*

## How to Add Fixtures

Fixtures can be added and managed through your admin portal:

1. Go to **Admin Portal → Fixtures**
2. Click "Add New Fixture"
3. Enter match details (opponent, date, time, venue, competition)
4. Save and publish

Fixtures will automatically appear on your website and can be published to social media.

---

**Don't miss a match!** Follow us on social media for match updates and reminders.`,
      is_published: 1,
    },
    {
      title: 'Results',
      slug: 'results',
      content: `# Match Results

## Latest Results

*Recent match results will automatically appear here from your Fixtures module.*

## Season Performance

Check back regularly for updates on how our teams are performing across all competitions.

## How to Add Results

Results can be added through your admin portal:

1. Go to **Admin Portal → Fixtures**
2. Find the completed fixture
3. Click "Add Result"
4. Enter the score in GAA format (goals-points)
5. Optionally add a match report
6. Publish to your website and social media

---

**Celebrate our victories!** Share match results with your community.`,
      is_published: 1,
    },
    {
      title: 'Club Shop',
      slug: 'shop',
      content: `# Club Shop

Show your support for ${clubName} with official club merchandise!

## Available Items

### Jerseys
- **Home Jersey**: *Available in all sizes*
- **Away Jersey**: *Available in all sizes*
- **Training Jersey**: *Available in all sizes*

### Sportswear
- Shorts
- Socks
- Training gear
- Tracksuits
- Hoodies

### Accessories
- Bags
- Water bottles
- Hats and caps
- Scarves

## How to Order

**Contact our club shop coordinator:**
- Email: ${clubEmail || 'shop@example.com'}
- Phone: *[Phone Number]*

**Collection:** Items can be collected at the club or arranged for delivery.

---

*Wearing club colors? Make sure to tag us on social media!*`,
      is_published: 1,
    },
    {
      title: 'Resources',
      slug: 'resources',
      content: `# Club Resources

## For Members

### Documents
- [Club Constitution](#) *(Coming soon)*
- [Code of Conduct](#) *(Coming soon)*
- [Child Safeguarding Policy](#) *(Coming soon)*
- [Health & Safety Guidelines](#) *(Coming soon)*

### Training Resources
- Training schedules
- Coaching tips
- Fitness programs
- Skill development guides

### Forms
- [Membership Registration](/contact)
- [Volunteer Application](/contact)
- [Facility Booking Request](/contact)

## For Coaches

- GAA Coaching Resources
- First Aid Information
- Child Safeguarding Training
- Coaching Certifications

## Useful Links

- [GAA Official Website](https://www.gaa.ie)
- [Club Governance](https://learning.gaa.ie)
- [Healthy Club Project](https://healthy club.gaa.ie)

---

*Can't find what you're looking for? [Contact us](/contact) and we'll help you out!*`,
      is_published: 1,
    },
    {
      title: 'Privacy Policy',
      slug: 'privacy-policy',
      content: `# Privacy Policy

**Last Updated**: ${new Date().toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })}

${clubName} ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or interact with our services.

## Information We Collect

### Personal Information
We may collect personal information that you voluntarily provide to us when you:
- Register for membership
- Submit forms or enquiries
- Subscribe to our newsletter
- Participate in club activities

This may include:
- Name and contact details
- Date of birth (for age-grading purposes)
- Emergency contact information
- Payment information (processed securely through third-party providers)

### Automatically Collected Information
When you visit our website, we may automatically collect certain information about your device, including:
- IP address
- Browser type
- Device information
- Usage data

## How We Use Your Information

We use the information we collect to:
- Manage club membership and registrations
- Communicate club news, fixtures, and events
- Process payments and fees
- Comply with GAA regulations and insurance requirements
- Improve our website and services
- Ensure child welfare and safeguarding compliance

## Data Retention

We retain personal information only for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required by law or GAA regulations.

Contact form submissions are automatically deleted after 30 days unless otherwise specified.

## Your Rights

Under GDPR, you have the right to:
- Access your personal data
- Correct inaccurate data
- Request deletion of your data
- Object to processing
- Data portability

To exercise these rights, please contact us at ${clubEmail || '[Club Email]'}.

## Children's Privacy

We take the protection of children's data seriously. Parental consent is required for members under 18 years of age. We comply with all relevant child welfare and safeguarding legislation.

## Security

We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.

## Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date.

## Contact Us

If you have questions about this Privacy Policy, please contact us at ${clubEmail || '[Club Email]'}.

*This is a template privacy policy. Please review and customize it with your legal advisor to ensure compliance with applicable laws.*`,
      is_published: 1,
    },
    {
      title: 'Terms of Use',
      slug: 'terms',
      content: `# Terms of Use

**Last Updated**: ${new Date().toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })}

## Acceptance of Terms

By accessing and using the ${clubName} website, you accept and agree to be bound by these Terms of Use and our Privacy Policy.

## Use of Website

### Permitted Use
This website is provided for informational purposes related to ${clubName} activities. You may:
- View and access content for personal, non-commercial use
- Download materials for personal reference
- Submit forms and enquiries through provided channels

### Prohibited Use
You must not:
- Use the website for any unlawful purpose
- Attempt to gain unauthorized access to any part of the website
- Transmit any harmful or malicious code
- Collect or harvest any information from the website
- Impersonate any person or entity

## Intellectual Property

All content on this website, including text, graphics, logos, images, and software, is the property of ${clubName} or its content suppliers and is protected by copyright and other intellectual property laws.

The GAA name, logo, and related marks are trademarks of the Gaelic Athletic Association.

## User-Generated Content

If you submit content to our website (such as comments or forms):
- You grant us a license to use, reproduce, and display that content
- You represent that you have the right to submit such content
- We reserve the right to remove any content at our discretion

## Disclaimers

### Content Accuracy
While we strive to keep information accurate and up-to-date, we make no representations or warranties about the accuracy, completeness, or reliability of any content on this website.

### Availability
We do not guarantee that the website will be available at all times. We may suspend, withdraw, or restrict access without notice.

### External Links
Our website may contain links to third-party websites. We are not responsible for the content, privacy policies, or practices of external sites.

## Liability Limitations

To the fullest extent permitted by law:
- We exclude all liability for any loss or damage arising from your use of this website
- We are not liable for any indirect, consequential, or punitive damages
- Our total liability shall not exceed €100

This does not affect your statutory rights as a consumer.

## Indemnification

You agree to indemnify and hold harmless ${clubName}, its officers, members, and volunteers from any claims, damages, or expenses arising from your use of the website or violation of these terms.

## Modifications

We reserve the right to modify these Terms of Use at any time. Changes will be effective immediately upon posting to the website. Your continued use constitutes acceptance of modified terms.

## Governing Law

These Terms of Use are governed by the laws of Ireland. Any disputes shall be subject to the exclusive jurisdiction of the Irish courts.

## Contact

For questions about these Terms of Use, please contact ${clubName} at ${clubEmail || '[Club Email]'}.

*This is a template terms of use document. Please review and customize it with your legal advisor to ensure it meets your club's specific needs.*`,
      is_published: 1,
    },
    {
      title: 'Safeguarding Statement',
      slug: 'safeguarding',
      content: `# Safeguarding Statement

${clubName} is fully committed to safeguarding the welfare of all children and young people who participate in our activities. We recognize our responsibility to promote safe practice and to protect children from harm.

## Our Commitment

We are committed to:
- Creating a safe and welcoming environment for all children
- Treating all children with respect and dignity
- Implementing and adhering to the GAA Code of Behaviour
- Recruiting, selecting, and training volunteers appropriately
- Responding promptly and appropriately to all child protection concerns

## GAA Children First Policy

${clubName} operates in accordance with:
- The GAA Code of Behaviour (Underage)
- Children First Act 2015
- Children First: National Guidance for the Protection and Welfare of Children

All coaches, mentors, and volunteers working with children have been:
- Garda vetted through the GAA vetting process
- Provided with Children First training
- Made aware of their responsibilities under the Code of Behaviour

## Code of Behaviour

All participants (children, parents, coaches, and officials) are expected to:
- Respect the rights, dignity, and worth of every person
- Treat everyone equally and not discriminate on any grounds
- Place the welfare and safety of children above other considerations
- Follow all guidelines and policies

## Designated Liaison Person (DLP)

Every GAA unit must have a designated Designated Liaison Person and Deputy DLP who are the first points of contact for child protection concerns.

**Designated Liaison Person**: *[Name and contact to be added]*
**Deputy DLP**: *[Name and contact to be added]*

## Reporting Concerns

If you have a child welfare or protection concern:

1. **Within ${clubName}**: Contact our DLP immediately
2. **Tusla (Child and Family Agency)**:
   - Phone: 1800 800 123
   - Report online: www.tusla.ie
3. **In an emergency**: Contact An Garda Síochána

## Complaints Procedure

${clubName} has a complaints procedure in place to deal with any issues or concerns in a fair, timely, and consistent manner, in accordance with GAA guidelines.

## Photography and Social Media

We have strict policies regarding:
- Photography at club events (consent required)
- Use of images in communications and online
- Social media usage by members
- Online interaction between adults and children

No child's image will be used without appropriate parental consent.

## Changing Facilities and Supervision

- Adequate supervision is provided at all times
- Children do not share changing facilities with adults
- Appropriate supervision ratios are maintained
- Clear guidelines exist for coaches regarding one-to-one situations

## Safe Recruitment

All volunteers working with children undergo:
- Garda vetting through the GAA process
- Reference checks
- Children First training
- Ongoing supervision and support

## Review

This policy is reviewed annually and updated as necessary to reflect best practice and comply with current legislation and GAA guidelines.

## Contact

For more information about our safeguarding policies and procedures, or to report a concern, please contact:

${clubEmail || '*Club contact email to be added*'}

**Tusla**: 1800 800 123
**Gardaí**: 999 or 112 (emergency)

---

*The welfare of children is everyone's responsibility. If you are concerned about a child, please report it.*

Last Updated: ${new Date().toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      is_published: 1,
    },
  ];
}
