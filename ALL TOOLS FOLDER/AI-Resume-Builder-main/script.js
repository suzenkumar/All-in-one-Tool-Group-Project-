document.addEventListener('DOMContentLoaded', function() {
  const generateBtn = document.getElementById('generateBtn');
  const loading = document.getElementById('loading');
  const downloadBtn = document.getElementById('downloadBtn');
  const copyBtn = document.getElementById('copyBtn');
  const errorMessage = document.getElementById('errorMessage');

  // Generate Resume Button
  generateBtn.addEventListener('click', async function() {
    const btn = this;
    const apiKey = document.getElementById('apiKey').value.trim();
    
    // Validate API key
    if (!apiKey) {
      showError('Please enter your Google Gemini API key first!');
      return;
    }




    apiKe
    
    // Hide any previous error
    hideError();
    
    btn.disabled = true;
    loading.classList.add('active');

    try {
      const formData = collectFormData();
      const prompt = createPrompt(formData);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: 0.1,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 4000,
            }
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        let errorMsg = `API Error: ${response.status}`;
        
        if (errorData.error) {
          if (errorData.error.message) {
            errorMsg = errorData.error.message;
          }
          
          if (errorData.error.status === 'RESOURCE_EXHAUSTED') {
            errorMsg = 'API quota exceeded. Please check your Google Cloud billing or try again later.';
          } else if (errorData.error.status === 'PERMISSION_DENIED') {
            errorMsg = 'API key invalid or not authorized. Please check your API key permissions.';
          } else if (errorData.error.status === 'INVALID_ARGUMENT') {
            errorMsg = 'Invalid request. Please check your input and try again.';
          }
        }
        
        throw new Error(errorMsg);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response from API. Please try again.');
      }
      
      const resumeHTML = data.candidates[0].content.parts[0].text;

      // Clean up the response
      let cleanHTML = resumeHTML
        .replace(/```html\n?/g, "")
        .replace(/```\n?/g, "")
        .replace(/```/g, "")
        .trim();

      // Validate that we got HTML content
      if (!cleanHTML.includes('<div') && !cleanHTML.includes('<table') && !cleanHTML.includes('<section')) {
        throw new Error('Invalid response format. The API did not return valid HTML. Please try again.');
      }

      document.getElementById("resumePreview").innerHTML = cleanHTML;
    } catch (error) {
      showError(error.message || "Error generating resume. Please try again.");
      console.error("Error:", error);
    } finally {
      loading.classList.remove('active');
      btn.disabled = false;
    }
  });

  // Download PDF Button
  downloadBtn.addEventListener("click", function() {
    window.print();
  });

  // Copy HTML Button
  copyBtn.addEventListener("click", function() {
    const resumeContent = document.getElementById("resumePreview").innerHTML;

    if (!resumeContent || resumeContent.includes("Fill out the form")) {
      alert("Please generate a resume first!");
      return;
    }

    const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume</title>
  <style>
    ${getResumeCSS()}
  </style>
</head>
<body>
${resumeContent}
</body>
</html>`;

    navigator.clipboard.writeText(fullHTML).then(() => {
      alert("Resume HTML copied to clipboard! Paste into a new file as resume.html");
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = fullHTML;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert("Resume HTML copied to clipboard! Paste into a new file as resume.html");
    });
  });

  function collectFormData() {
    return {
      resumeType: document.getElementById('resumeType').value,
      personalInfo: document.getElementById('personalInfo').value,
      education: document.getElementById('education').value,
      experience: document.getElementById('experience').value,
      projects: document.getElementById('projects').value,
      skills: document.getElementById('skills').value,
      extracurricular: document.getElementById('extracurricular').value
    };
  }

  function createPrompt(data) {
    return `Create a professional ${data.resumeType} resume in clean HTML format only (no markdown, no code blocks). Use semantic HTML with these exact CSS classes for styling: resume-header, resume-name, resume-contact, resume-section, resume-section-title, resume-item, resume-item-header, resume-item-subtitle, resume-item-location, resume-list.

Personal Information: ${data.personalInfo}

Education: ${data.education}

Experience: ${data.experience}

Projects: ${data.projects}

Skills: ${data.skills}

Extracurricular: ${data.extracurricular}

Format exactly like a LaTeX resume with:
- Name in 28pt, small-caps, centered
- Contact info below name
- Section titles with bottom border
- Bullet points for achievements
- Professional, clean layout`;
  }

  function getResumeCSS() {
    return `
      body {
        font-family: 'Georgia', 'Times New Roman', serif;
        line-height: 1.4;
        font-size: 11pt;
        max-width: 800px;
        margin: 20px auto;
        padding: 40px;
        color: #000;
      }
      .resume-header { text-align: center; margin-bottom: 15px; border-bottom: 1px solid #000; padding-bottom: 10px; }
      .resume-name { font-size: 28pt; font-weight: normal; letter-spacing: 3px; margin-bottom: 5px; font-variant: small-caps; }
      .resume-contact { font-size: 10pt; margin: 5px 0; }
      .resume-contact a { color: #000; text-decoration: none; margin: 0 10px; }
      .resume-section { margin: 15px 0; }
      .resume-section-title { font-size: 14pt; font-weight: bold; border-bottom: 1px solid #000; margin: 12px 0 8px 0; padding-bottom: 2px; }
      .resume-item { margin: 10px 0; }
      .resume-item-header { display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 2px; }
      .resume-item-subtitle { font-style: italic; margin-bottom: 5px; }
      .resume-item-location { font-style: italic; text-align: right; font-size: 10pt; }
      .resume-list { margin-left: 20px; margin-top: 5px; list-style: none; }
      .resume-list li { margin: 3px 0; text-indent: -20px; padding-left: 20px; }
      .resume-list li:before { content: "• "; }
      @media print { body { padding: 20px; } }
    `;
  }

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('active');
  }

  function hideError() {
    errorMessage.classList.remove('active');
  }
});