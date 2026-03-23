export type AssistantLanguage = 'en' | 'hi';

type Topic = 'dementia' | 'memory' | 'lifestyle' | 'cognitive' | 'general';

function detectTopic(message: string): Topic {
  const text = message.toLowerCase();

  if (/(dementia|alzheimer|what is dementia|forgetfulness|mci|demensia)/.test(text)) {
    return 'dementia';
  }
  if (/(memory|remember|recall|memory tips|memory improve|focus|yaad)/.test(text)) {
    return 'memory';
  }
  if (/(sleep|diet|food|exercise|stress|lifestyle|routine|walking|nind|khana|vyayam)/.test(text)) {
    return 'lifestyle';
  }
  if (/(brain health|cognitive|prevention|prevent|mental sharpness|healthy brain|dimag)/.test(text)) {
    return 'cognitive';
  }
  return 'general';
}

function buildEnglishReply(topic: Topic): string {
  switch (topic) {
    case 'dementia':
      return [
        'Dementia is not a single disease. It is a group of symptoms that affect memory, communication, reasoning, and daily functioning.',
        '',
        'What to know:',
        '• Mild forgetfulness can happen with aging, but worsening confusion and daily-life difficulty need attention.',
        '• Early screening helps families notice patterns sooner and seek professional guidance earlier.',
        '',
        'What to do next:',
        '• Track repeated changes over time.',
        '• Speak with a clinician if symptoms are increasing.',
        '• Use this tool as screening support, not as a diagnosis.',
      ].join('\n');
    case 'memory':
      return [
        'Memory can improve when practice is consistent and realistic. Small daily routines work better than intense occasional effort.',
        '',
        'Helpful habits:',
        '• Use word recall, reading aloud, and short story retelling exercises.',
        '• Repeat names, appointments, and key tasks out loud.',
        '• Keep notes, alarms, and checklists to reduce mental overload.',
        '',
        'Daily tip:',
        'Try 10 to 15 minutes of recall practice, one conversation-based activity, and one focused task without distractions.',
      ].join('\n');
    case 'lifestyle':
      return [
        'Lifestyle has a strong effect on cognitive health. Sleep, movement, nutrition, and stress control all matter.',
        '',
        'Best priorities:',
        '• Walk regularly or do light exercise most days.',
        '• Protect sleep quality and hydration.',
        '• Choose a balanced diet with fruits, vegetables, proteins, and healthy fats.',
        '',
        'Daily tip:',
        'A steady routine with exercise, sleep, and social interaction is more protective than one-time changes.',
      ].join('\n');
    case 'cognitive':
      return [
        'Cognitive health means keeping memory, attention, language, and decision-making as strong as possible over time.',
        '',
        'Ways to support it:',
        '• Stay mentally active with reading, games, conversation, or learning.',
        '• Stay socially connected and physically active.',
        '• Monitor changes instead of relying on one isolated impression.',
        '',
        'Daily tip:',
        'Use regular screening plus healthy habits to notice trends early and respond with confidence.',
      ].join('\n');
    default:
      return [
        'I can help with dementia basics, memory improvement, lifestyle advice, and cognitive health guidance.',
        '',
        'You can ask things like:',
        '• What is dementia?',
        '• How can I improve memory?',
        '• What lifestyle changes support brain health?',
        '',
        'I will give clear screening-focused guidance and practical next steps.',
      ].join('\n');
  }
}

function buildHindiReply(topic: Topic): string {
  switch (topic) {
    case 'dementia':
      return [
        'डिमेंशिया कोई एक बीमारी नहीं है। यह उन लक्षणों का एक समूह है जो स्मृति, संचार, तर्क और दैनिक कामकाज को प्रभावित करते हैं।',
        '',
        'मुख्य जानकारी:',
        '• उम्र के साथ हल्की भूलने की बीमारी हो सकती है, लेकिन बढ़ती भ्रम और दैनिक जीवन की कठिनाई पर ध्यान देना चाहिए।',
        '• प्रारंभिक स्क्रीनिंग परिवारों को पैटर्न को जल्दी पहचानने और उचित मार्गदर्शन प्राप्त करने में मदद करती है।',
        '',
        'अगले कदम:',
        '• समय के साथ बार-बार होने वाले परिवर्तनों को ट्रैक करें।',
        '• यदि लक्षण बढ़ रहे हैं तो चिकित्सक से बात करें।',
        '• इसे केवल एक स्क्रीनिंग उपकरण के रूप में उपयोग करें, निदान के रूप में नहीं।',
      ].join('\n');
    case 'memory':
      return [
        'जब अभ्यास निरंतर और वास्तविक हो, तो स्मृति में सुधार हो सकता है। भारी कोशिश के बजाय दैनिक दिनचर्या बेहतर काम करती है।',
        '',
        'मददगार आदतें:',
        '• शब्दों को याद करना, ज़ोर से पढ़ना और छोटी कहानी सुनाना जैसे अभ्यासों का उपयोग करें।',
        '• नाम, अपॉइंटमेंट और मुख्य कार्यों को ज़ोर से दोहराएं।',
        '• मानसिक बोझ कम करने के लिए नोट्स, अलार्म और चेकलिस्ट रखें।',
        '',
        'दैनिक टिप:',
        '10 से 15 मिनट स्मृति अभ्यास, एक बातचीत आधारित गतिविधि और बिना विचलित हुए एक ध्यान केंद्रित कार्य करने का प्रयास करें।',
      ].join('\n');
    case 'lifestyle':
      return [
        'जीवनशैली का संज्ञानात्मक स्वास्थ्य पर गहरा प्रभाव पड़ता है। नींद, शारीरिक गतिविधि, पोषण और तनाव नियंत्रण सभी मायने रखते हैं।',
        '',
        'बेहतर प्राथमिकताएं:',
        '• नियमित रूप से टहलें या हल्के व्यायाम करें।',
        '• नींद की गुणवत्ता और पानी का पर्याप्त सेवन (हाइड्रेशन) सुनिश्चित करें।',
        '• फलों, सब्जियों, प्रोटीन और स्वस्थ वसा वाला संतुलित आहार चुनें।',
        '',
        'दैनिक टिप:',
        'व्यायाम, नींद और सामाजिक मेलजोल के साथ एक स्थिर दिनचर्या एक बार के बड़े बदलावों से अधिक सुरक्षात्मक है।',
      ].join('\n');
    case 'cognitive':
      return [
        'संज्ञानात्मक स्वास्थ्य का अर्थ है स्मृति, ध्यान, भाषा और निर्णय लेने की क्षमता को समय के साथ यथासंभव मजबूत बनाए रखना।',
        '',
        'सहयोग करने के तरीके:',
        '• पढ़ने, खेल, बातचीत या सीखने के साथ मानसिक रूप से सक्रिय रहें।',
        '• सामाजिक रूप से जुड़े रहें और शारीरिक रूप से सक्रिय रहें।',
        '• केवल एक घटना पर निर्भर रहने के बजाय लगातार बदलावों की निगरानी करें।',
        '',
        'दैनिक टिप:',
        'रुझानों को जल्दी पहचानने और आत्मविश्वास के साथ प्रतिक्रिया देने के लिए नियमित स्क्रीनिंग और स्वस्थ आदतों का उपयोग करें।',
      ].join('\n');
    default:
      return [
        'मैं डिमेंशिया की बुनियादी बातें, स्मृति सुधार, जीवनशैली सलाह और संज्ञानात्मक स्वास्थ्य मार्गदर्शन में मदद कर सकता हूँ।',
        '',
        'आप इस तरह की चीजें पूछ सकते हैं:',
        '• डिमेंशिया क्या है?',
        '• मैं स्मृति में सुधार कैसे कर सकता हूँ?',
        '• मस्तिष्क स्वास्थ्य के लिए कौन से जीवनशैली बदलाव आवश्यक हैं?',
        '',
        'मैं स्पष्ट स्क्रीनिंग-केंद्रित मार्गदर्शन और व्यावहारिक अगले कदम प्रदान करूँगा।',
      ].join('\n');
  }
}

export function getAssistantReply(message: string, language: AssistantLanguage): string {
  const topic = detectTopic(message);
  return language === 'hi' ? buildHindiReply(topic) : buildEnglishReply(topic);
}
