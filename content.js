// All survey wording lives here. survey.js only handles flow and display.
// Each object in DOMAINS is one part of the questionnaire.

// The questionnaire has four parts in total; parts not yet written still count
// in the "Part X of 4" indicator. Titles are only shown once the person is in that part.
const TOTAL_PARTS = 4;

const WELCOME = {
  title: "Understanding Your Daily Experiences and Thought Patterns",
  text: [
    "Thank you for taking this questionnaire. This self-report assesses your daily routines, repetitive habits, and thought patterns. We aim to evaluate whether these behaviors take significant time, feel hard to control, disrupt daily life, or cause distress.",
    "Please answer each question honestly based on your recent experiences. There are no right or wrong answers."
  ]
};

const FREQUENCY_SCALE = ["Never", "Rarely", "Sometimes", "Often"];
// Answer scale for all follow-up questions (5 points).
const SCALE_INTENSITY = ["Not at all", "A little", "Somewhat", "A lot", "Extremely"];

const DOMAINS = [
  {
    id: "checking",
    title: "Checking",
    // Paragraphs, each a list of sentences. Sentences are revealed one at a
    // time: each Continue adds the next sentence (at the end of the same
    // paragraph, or as a new paragraph). The last Continue starts the items.
    intro: [
      [
        "Checking behavior means making sure more than once that something is safe, correct, or in order.",
        "At times, people may check the same thing again or return to it to make sure everything is as it should be."
      ],
      [
        "In the following questions, please mark the types of checking behavior that you currently engage in."
      ]
    ],
    // Fixed line shown above every item question.
    screenerPrompt: "Thinking about your life currently:",
    screenerOptions: FREQUENCY_SCALE,
    // Items rated at or above this option index count as "endorsed" and
    // trigger the follow-up questions (2 = "Sometimes").
    endorseThreshold: 2,
    // 1 = one item per screen with auto-advance; >1 = grid of items with a Next button.
    itemsPerScreen: 1,
    // text = full item shown on its own screen; short = few-word label used in
    // the reminder on the follow-up questions.
    items: [
      { id: "chk_doors",        icon: "lock",           short: "Doors or windows",
        text: "How often do you keep checking that the doors or windows are locked?" },
      { id: "chk_appliances",   icon: "flame",          short: "Stove or appliances",
        text: "How often do you go back to check that the stove or other appliances are off?" },
      { id: "chk_belongings",   icon: "wallet",         short: "Wallet, phone, or keys",
        text: "When you’re out, how often do you keep checking that you still have your wallet, phone, or keys?" },
      { id: "chk_messages",     icon: "mail",           short: "Rereading messages",
        text: "How often do you reread a message or email before sending it?" },
      { id: "chk_sent_to",      icon: "send",           short: "Message sent to the right person",
        text: "After sending a message, how often do you keep checking that it went to the right person?" },
      { id: "chk_appearance",   icon: "user",           short: "Appearance",
        text: "How often do you keep checking your appearance for flaws?" },
      { id: "chk_illness",      icon: "stethoscope",    short: "Signs of illness or injury",
        text: "How often do you keep checking your body for signs of illness or injury?" },
      { id: "chk_mistakes",     icon: "checklist",      short: "Mistakes in work",
        text: "How often do you go over your work to look for mistakes, even after you already checked?" },
      { id: "chk_hazards",      icon: "alert-triangle", short: "Dangerous things left behind",
        text: "How often do you go back to check that you didn’t leave something dangerous behind, like a sharp object or something people could trip over?" },
      { id: "chk_harm",         icon: "car",            short: "Not hurting someone",
        text: "How often do you keep checking that you didn’t accidentally hurt someone, for example while driving?" },
      { id: "chk_loved_ones",   icon: "heart",          short: "Loved ones are safe",
        text: "How often do you keep calling or texting loved ones to make sure they are safe?" },
      { id: "chk_understood",   icon: "message-2",      short: "Asking if understood",
        text: "How often do you keep asking people whether they understood what you meant?" },
      { id: "chk_replay",       icon: "history",        short: "Replaying conversations",
        text: "How often do you replay conversations in your head to make sure you didn’t say anything wrong?" }
    ],
    // Shown above the list of endorsed items, on the lead-in and every follow-up question.
    followupLead: "Here are the checking habits you noted as having sometimes or often:",
    // Frequency follow-up dropped: the item ratings already measure frequency.
    followup: [
      { id: "chk_distress",     label: "Distress",
        text: "Thinking about the checking habits, how upset or distressed do you feel about having them?",
        options: SCALE_INTENSITY },
      { id: "chk_interference", label: "Interference",
        text: "Thinking about the checking habits, how much do they interfere with your everyday life (for example, your work, relationships, or leisure time)?",
        options: SCALE_INTENSITY },
      { id: "chk_resistance",   label: "Control/Resistance",
        text: "Thinking about the checking habits, to what extent are you able to resist them?",
        options: SCALE_INTENSITY },
      { id: "chk_change",       label: "Need for change",
        text: "Thinking about the checking habits, if you could magically stop them overnight, how much better would your life be?",
        options: SCALE_INTENSITY }
    ]
  },
  {
    id: "cleaning",
    title: "Cleaning",
    intro: [
      "Cleaning and washing are part of everyday life. Sometimes, people may repeat certain cleaning and washing actions, such as washing their hands multiple times, repeatedly wiping down surfaces, or following a strict and elaborate routine in the shower."
    ],
    screenerPrompt: "How often do you do this?",
    screenerOptions: FREQUENCY_SCALE,
    endorseThreshold: 2,
    itemsPerScreen: 1,
    items: [
      { id: "cln_handwash",       icon: "hand-stop",    short: "Washing hands",         text: "Washing your hands repeatedly" },
      { id: "cln_sanitizer",      icon: "spray",        short: "Hand sanitizer",        text: "Using hand sanitizer repeatedly" },
      { id: "cln_long_shower",    icon: "bath",         short: "Long showers or baths", text: "Showering or bathing for a very long time" },
      { id: "cln_shower_routine", icon: "list-numbers", short: "Shower routine",        text: "Following a fixed and repetitive routine in the shower" },
      { id: "cln_teeth",          icon: "dental",       short: "Brushing teeth",        text: "Brushing your teeth repeatedly, or for a long time" },
      { id: "cln_toilet",         icon: "toilet-paper", short: "Toilet routine",        text: "Cleaning yourself following a prolonged routine after using the toilet" },
      { id: "cln_clothes_change", icon: "shirt",        short: "Changing clothes",      text: "Changing your clothes multiple times a day" },
      { id: "cln_laundry",        icon: "wash-machine", short: "Laundry",               text: "Washing your clothes or doing the laundry very often" },
      { id: "cln_surfaces",       icon: "sparkles",     short: "Wiping surfaces",       text: "Wiping down counters or surfaces over and over" },
      { id: "cln_objects",        icon: "bucket",       short: "Cleaning objects",      text: "Cleaning household items or objects repeatedly" }
    ],
    followupLead: "Please think about the cleaning and washing habits at present that you sometimes or often do:",
    // Frequency follow-up dropped, as in Checking.
    followup: [
      { id: "cln_distress",     label: "Distress",
        text: "How upset or distressed do you feel about these repetitive cleaning or washing behaviors?",
        options: SCALE_INTENSITY },
      { id: "cln_interference", label: "Interference",
        text: "How much do these repeated cleaning or washing behaviors interfere with your everyday life (for example, your work, relationships, or personal time)?",
        options: SCALE_INTENSITY },
      { id: "cln_resistance",   label: "Control/Resistance",
        text: "To what extent are you able to resist these cleaning or washing behaviors?",
        options: SCALE_INTENSITY },
      { id: "cln_change",       label: "Need for change",
        text: "If you could magically stop these repetitive cleaning and washing behaviors overnight, how much better would your life be?",
        options: SCALE_INTENSITY }
    ]
  },
  {
    id: "obsessing",
    title: "Obsessing",
    intro: [
      "Obsessing means having repeated, unwanted thoughts, images, or urges that feel intrusive and hard to control. These thoughts may focus on harm, mistakes, morality, relationships, health, or other concerns. They can often come back even when you try to ignore them or think about something else."
    ],
    screenerPrompt: "How often do you experience this?",
    screenerOptions: FREQUENCY_SCALE,
    endorseThreshold: 2,
    itemsPerScreen: 1,
    items: [
      { id: "obs_harm_self",      icon: "heart-broken",  short: "Hurting yourself",
        text: "Unwanted thoughts or urges about hurting yourself" },
      { id: "obs_harm_others",    icon: "alert-octagon", short: "Hurting someone else",
        text: "Unwanted thoughts or urges about hurting someone else" },
      { id: "obs_violent_images", icon: "photo",         short: "Scary pictures",
        text: "Violent or scary pictures popping into your mind" },
      { id: "obs_sexual",         icon: "eye-off",       short: "Thoughts about sex",
        text: "Uncomfortable or unwanted thoughts about sex" },
      { id: "obs_blurting",       icon: "speakerphone",  short: "Embarrassing yourself",
        text: "Fears of yelling out bad words or doing something terribly embarrassing" },
      { id: "obs_bad_person",     icon: "scale",         short: "Being a bad person",
        text: "Intense worries about doing the wrong thing or being a bad person" },
      { id: "obs_religion",       icon: "book",          short: "Religion or morals",
        text: "Scary thoughts about going against your religion or morals" },
      { id: "obs_illness",        icon: "virus",         short: "Disease or illness",
        text: "Constant worries about catching a disease or having a serious illness" },
      { id: "obs_contamination",  icon: "droplet",       short: "Dirt or contamination",
        text: "Strong feelings that you or things around you are dirty or contaminated" },
      { id: "obs_just_right",     icon: "adjustments",   short: "Not \"just right\"",
        text: "A nagging feeling that something isn't \"just right\"" },
      { id: "obs_need_to_know",   icon: "brain",         short: "Remembering details",
        text: "An intense need to know or remember minor details" }
    ],
    followupLead: "Please think about the unwanted thoughts, images, or urges at present that you sometimes or often have:",
    // Frequency follow-up dropped, as in Checking.
    followup: [
      { id: "obs_distress",     label: "Distress",
        text: "How upset or distressed do you feel because of these unwanted thoughts, images, or urges?",
        options: SCALE_INTENSITY },
      { id: "obs_interference", label: "Interference",
        text: "How much do these unwanted thoughts, images, or urges interfere with your everyday life (for example, your work, relationships, or personal time)?",
        options: SCALE_INTENSITY },
      { id: "obs_resistance",   label: "Control/Resistance",
        text: "To what extent are you able to resist or control these unwanted thoughts, images, or urges?",
        options: SCALE_INTENSITY },
      { id: "obs_change",       label: "Need for change",
        text: "If you could magically stop these unwanted thoughts and images overnight, how much better would your life be?",
        options: SCALE_INTENSITY }
    ]
  },
  {
    id: "ordering",
    title: "Ordering",
    intro: [
      "Ordering behavior means arranging, organizing, or positioning things so they feel accurate or just right. This can include lining up objects, arranging items in a specific order, making things symmetrical, or adjusting things until they look or feel correct."
    ],
    screenerPrompt: "How often does this happen to you?",
    screenerOptions: FREQUENCY_SCALE,
    endorseThreshold: 2,
    itemsPerScreen: 1,
    items: [
      { id: "ord_arranging",   icon: "layout-grid",            short: "Arranging in order",
        text: "Arranging items in a very specific way or order" },
      { id: "ord_lining_up",   icon: "ruler",                  short: "Lining up objects",
        text: "Lining up objects so they are perfectly straight, even, or balanced" },
      { id: "ord_adjusting",   icon: "adjustments-horizontal", short: "Adjusting until \"just right\"",
        text: "Adjusting things over and over until they look or feel \"just right\"" },
      { id: "ord_upset_moved", icon: "mood-sad",               short: "Upset when things are moved",
        text: "Feeling very upset if someone moves your things out of order" },
      { id: "ord_repeating",   icon: "door",                   short: "Repeating simple actions",
        text: "Repeating simple actions (like walking through a door or sitting down) until it feels correct" },
      { id: "ord_counting",    icon: "abacus",                 short: "Counting things",
        text: "Counting things for no reason while doing everyday tasks" }
    ],
    followupLead: "Please think about the ordering habits at present that you sometimes or often do:",
    // Frequency follow-up dropped, as in Checking.
    followup: [
      { id: "ord_distress",     label: "Distress",
        text: "How upset or distressed do you feel about these ordering behaviors?",
        options: SCALE_INTENSITY },
      { id: "ord_interference", label: "Interference",
        text: "How much do these ordering behaviors interfere with your everyday life (for example, your work, relationships, or personal time)?",
        options: SCALE_INTENSITY },
      { id: "ord_resistance",   label: "Control/Resistance",
        text: "To what extent are you able to resist these ordering behaviors?",
        options: SCALE_INTENSITY },
      { id: "ord_change",       label: "Need for change",
        text: "If you could magically stop these ordering behaviors overnight, how much better would your life be?",
        options: SCALE_INTENSITY }
    ]
  }
];

const END = {
  title: "Thank you",
  text: "You have completed the questionnaire. Thank you for your time."
};
