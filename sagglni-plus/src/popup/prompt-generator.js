/**
 * Build interview prompt for the AI based on the PROMPT_TEMPLATE structure.
 */
function buildInterviewPrompt(profile) {
  const pi = profile?.data?.personalInfo || {};
  const firstName = pi.firstName || '';
  const lastName = pi.lastName || '';
  const email = pi.email || '';
  const phone = pi.phone || '';
  const prompt = `Please answer the interview questions based on the profile below:\n\nFirst Name: ${firstName}\nLast Name: ${lastName}\nEmail: ${email}\nPhone: ${phone}\n\nAnswer fully in JSON format as per the Sagglni Profile schema between the markers:\n===== START PROFILE DATA =====\n{ ... }\n===== END PROFILE DATA =====n`;
  return prompt;
}

module.exports = { buildInterviewPrompt };
if (typeof window !== 'undefined') window.buildInterviewPrompt = buildInterviewPrompt;
