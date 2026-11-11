// All survey wording lives here. survey.js only handles flow and display.
// To add a new symptom domain (e.g. washing), add another object to DOMAINS.

const WELCOME = {
  title: "Understanding Your Daily Experiences and Thought Patterns",
  text: [
    "Thank you for taking this questionnaire. This self-report assesses your daily routines, repetitive habits, and thought patterns. We aim to evaluate whether these behaviors take significant time, feel hard to control, disrupt daily life, or cause distress.",
    "Please answer each question honestly based on your recent experiences. There are no right or wrong answers."
  ]
};

const SCALE_INTENSITY = ["Not at all", "A little", "A lot", "Extremely"];

const DOMAINS = [
  {
    id: "checking",
    title: "Checking",
    intro: [
      "Checking behavior means making sure more than once that something is safe, correct, or in order. At times, people may check the same thing again or return to it to make sure everything is as it should be.",
      "Common examples are checking that doors or windows are locked, that stoves or heaters are off, or that no accident has occurred."
    ],
    screenerPrompt: "How often do you repeat or double-check each of the following?",
    screenerOptions: ["Never", "Rarely", "Sometimes", "Often"],
    // Items rated at or above this option index count as "endorsed" and
    // trigger the follow-up questions (2 = "Sometimes").
    endorseThreshold: 2,
    itemsPerScreen: 4,
    items: [
      { id: "chk_doors",        icon: "lock",           text: "Checking that doors or windows are locked" },
      { id: "chk_appliances",   icon: "flame",          text: "Checking that the stove, oven, or appliances are off" },
      { id: "chk_belongings",   icon: "wallet",         text: "Checking that your wallet or important belongings are not lost" },
      { id: "chk_messages",     icon: "mail",           text: "Checking your text messages or emails" },
      { id: "chk_appearance",   icon: "user",           text: "Checking your physical appearance or specific body parts" },
      { id: "chk_illness",      icon: "stethoscope",    text: "Checking your body for signs of illness" },
      { id: "chk_mistakes",     icon: "checklist",      text: "Checking your work or routine tasks to make sure you didn't make a mistake" },
      { id: "chk_harm",         icon: "users",          text: "Checking to make sure you did not accidentally hurt someone" },
      { id: "chk_catastrophe",  icon: "alert-triangle", text: "Checking to make sure nothing terrible happened" },
      { id: "chk_understood",   icon: "message-2",      text: "Checking that others understood you well" },
      { id: "chk_conversations",icon: "repeat",         text: "Going over past conversations in your head again and again" },
      { id: "chk_events",       icon: "history",        text: "Going over past events in your head again and again" }
    ],
    followupIntro: "Please think about your own checking habits at present and answer the following questions.",
    followup: [
      { id: "chk_frequency",    label: "Frequency",
        text: "How often do you engage in these types of checking behaviors in your daily life?",
        options: ["Never", "Rarely", "Sometimes", "Very often"] },
      { id: "chk_distress",     label: "Distress",
        text: "How upset or distressed do you feel about these checking behaviors?",
        options: SCALE_INTENSITY },
      { id: "chk_interference", label: "Interference",
        text: "How much do these checking behaviors interfere with your everyday life (for example, your work, relationships, or leisure time)?",
        options: SCALE_INTENSITY },
      { id: "chk_resistance",   label: "Control/Resistance",
        text: "To what extent are you able to resist these checking behaviors?",
        options: SCALE_INTENSITY },
      { id: "chk_change",       label: "Need for change",
        text: "If you could magically stop these checking behaviors overnight, how much better would your life be?",
        options: SCALE_INTENSITY }
    ]
  }
];

const END = {
  title: "Thank you",
  text: "You have completed the questionnaire. Thank you for your time."
};
