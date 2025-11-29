/**
 * Build interview prompt for the AI based on the PROMPT_TEMPLATE structure.
 */
function summarizeProfileForPrompt(profile) {
  const pi = (profile && profile.data && profile.data.personalInfo) || {}; // keep safe extraction
  const skills = (profile && profile.data && profile.data.skills && profile.data.skills.technical) || [];
  const short = {
    firstName: pi.firstName || null,
    lastName: pi.lastName || null,
    email: pi.email || null,
    phone: pi.phone || null,
    topSkills: skills.slice(0, 5),
  };
  return short;
}

function buildInterviewPrompt(profile, options = {}) {
  // Options: { modelType: 'default'|'lmstudio', concise: bool }
  const opt = Object.assign({ modelType: 'default', concise: false }, options);
  const data = summarizeProfileForPrompt(profile);
  // Build concise instruction set tuned for local LM models like LM Studio (short tokens)
  if (opt.modelType === 'lmstudio') {
    // Minimal framing, request a JSON output with only changed fields
    const content = [];
    Object.keys(data).forEach(k => {
      const v = data[k];
      if (v === null || (Array.isArray(v) && v.length === 0)) return; // skip empty
      if (Array.isArray(v)) content.push(`${k}: ${v.join(', ')}`);
      else content.push(`${k}: ${v}`);
    });
    const body = content.join('\n');
    const prompt = `You are a helpful assistant. Given the profile metadata below, return a compact JSON object that conforms to the Sagglni profile schema. Return only JSON, no extra commentary. If a field cannot be inferred, set it to null.\n\n${body}\n\nOutput between markers:\n===== START PROFILE DATA =====\n{ ... }\n===== END PROFILE DATA =====n`;
    return prompt;
  }
  // Default verbose prompt
  const pi = profile?.data?.personalInfo || {};
  const firstName = pi.firstName || '';
  const lastName = pi.lastName || '';
  const email = pi.email || '';
  const phone = pi.phone || '';
  return `Please answer interview questions based on this profile:\n\nFirst Name: ${firstName}\nLast Name: ${lastName}\nEmail: ${email}\nPhone: ${phone}\n\nReturn valid JSON only between markers:\n===== START PROFILE DATA =====\n{ ... }\n===== END PROFILE DATA =====n`;
}

module.exports = { buildInterviewPrompt };
if (typeof window !== 'undefined') window.buildInterviewPrompt = buildInterviewPrompt;
