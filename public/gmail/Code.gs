/**
 * CheckItSA Gmail Add-on
 * Analyzes emails for scams using CheckItSA AI.
 */

function onHomePage(e) {
  var card = CardService.newCardBuilder();
  card.setHeader(CardService.newCardHeader().setTitle("CheckItSA Scanner"));
  
  var section = CardService.newCardSection()
    .addWidget(CardService.newTextParagraph().setText("Open an email to scan it for scams and phishing attempts."));
  
  card.addSection(section);
  return card.build();
}

function onGmailMessage(e) {
  var accessToken = e.messageMetadata.accessToken;
  GmailApp.setCurrentMessageAccessToken(accessToken);
  
  var messageId = e.messageMetadata.messageId;
  var message = GmailApp.getMessageById(messageId);
  
  var from = message.getFrom();
  var subject = message.getSubject();
  var body = message.getPlainBody().substring(0, 1500);
  
  // Extract email address from "Name <email@domain.com>"
  var senderEmail = from;
  var emailMatch = from.match(/<(.+?)>/);
  if (emailMatch) senderEmail = emailMatch[1];

  var results = callCheckItSA(senderEmail, subject, body);
  
  return buildResultCard(results);
}

function callCheckItSA(sender, subject, body) {
  var url = "https://checkitsa.co.za/api/verify/email";
  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      email: sender,
      subject: subject,
      body: body
    }),
    muteHttpExceptions: true
  };
  
  try {
    var response = UrlFetchApp.fetch(url, options);
    return JSON.parse(response.getContentText());
  } catch (err) {
    return { status: "Error", message: "Network error. Try again later." };
  }
}

function buildResultCard(data) {
  var statusEmoji = "✅";
  if (data.status === "Dangerous") statusEmoji = "⛔";
  if (data.status === "Suspicious") statusEmoji = "⚠️";
  
  var card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle(statusEmoji + " Scan Result: " + data.status)
      .setSubtitle("Risk Score: " + data.score + "/100")
    );

  var aiSection = CardService.newCardSection().setHeader("AI BRAIN INSIGHT");
  if (data.ai_analysis) {
    aiSection.addWidget(CardService.newTextParagraph().setText('"' + data.ai_analysis.reasoning + '"'));
  } else {
    aiSection.addWidget(CardService.newTextParagraph().setText("Standard security scanning complete."));
  }
  card.addSection(aiSection);

  var flagsSection = CardService.newCardSection().setHeader("RISK FACTORS");
  if (data.flags && data.flags.length > 0) {
    data.flags.forEach(function(flag) {
      flagsSection.addWidget(CardService.newTextParagraph().setText("• " + flag));
    });
  } else {
    flagsSection.addWidget(CardService.newTextParagraph().setText("No obvious risk factors detected."));
  }
  card.addSection(flagsSection);
  
  var footer = CardService.newFixedFooter()
    .setPrimaryButton(CardService.newTextButton()
      .setText("Detailed Report")
      .setOpenLink(CardService.newOpenLink().setUrl("https://checkitsa.co.za")));
  
  card.setFixedFooter(footer);
  
  return card.build();
}
