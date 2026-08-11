/* =====================================================================
   WEDDING CONFIG — Edit everything here. No need to touch the HTML.
   Save, refresh, done.
   ===================================================================== */

window.WEDDING = {
  /* --- Couple --- */
  name1: "Alex",
  name2: "Bella",
  initial1: "A",
  initial2: "B",

  /* --- The date & time of the wedding (drives the countdown) ---
     Format: "YYYY-MM-DDTHH:MM:SS" (24-hour, local time) */
  weddingDateTime: "2026-12-30T15:00:00",
  dateLong: "Wednesday, the 30th of December 2026",

  /* --- Ceremony --- */
  ceremonyTime: "15:00",
  ceremonyVenue: "Ceremony venue name",
  ceremonyAddr: "Street address, City",

  /* --- Reception --- */
  receptionTime: "18:00",
  receptionVenue: "Reception venue name",
  receptionAddr: "Street address, City",

  /* --- Dress code --- */
  dressCode: "Formal",
  dressNote: "Black tie optional. Emerald accents encouraged.",

  /* --- Main venue (map + directions) --- */
  venueShort: "Cape Town, South Africa",
  venueName: "Venue Name",
  venueAddr: "123 Vineyard Road,<br>Constantia, Cape Town,<br>7806, South Africa",
  venueMapQuery: "Constantia, Cape Town, South Africa",
  parkingNote: "Parking is available on-site. Carpooling encouraged.",

  /* --- Our story timeline --- */
  story: [
    { year: "2019", title: "We met",       text: "Write how you met here — the party, the app, the coffee shop, the moment." },
    { year: "2022", title: "First home",   text: "A milestone along the way — moving in, the dog, the trip that changed everything." },
    { year: "2025", title: "She said yes", text: "The proposal story. Keep it short and sweet — make them feel it." },
    { year: "2026", title: "Forever",      text: "And now we celebrate with the people we love the most. That's you." },
  ],

  /* --- Schedule of the day --- */
  schedule: [
    { time: "14:30", title: "Guests arrive",   text: "Find your seat and settle in." },
    { time: "15:00", title: "The ceremony",    text: "We say “I do”. Tissues recommended." },
    { time: "16:00", title: "Canapés & drinks", text: "Golden-hour photos, bubbly and mingling." },
    { time: "18:00", title: "Reception",        text: "Dinner, speeches and a few surprises." },
    { time: "20:30", title: "First dance",      text: "Then the floor is yours." },
    { time: "00:00", title: "Last dance",       text: "Send us off in style." },
  ],

  /* --- FAQ --- */
  faq: [
    { q: "Can I bring a plus one?",       a: "Plus ones are indicated on your invitation. If you're unsure, just ask us!" },
    { q: "Are children welcome?",         a: "We love your little ones, but this will be an adults-only celebration." },
    { q: "What should I wear?",           a: "Formal attire. Black tie optional — and we'd love a touch of emerald." },
    { q: "Will there be parking?",        a: "Yes, free parking is available at the venue. Carpooling is encouraged." },
    { q: "Can I take photos?",            a: "Unplugged ceremony — cameras away until we're married. Then snap away and share!" },
  ],

  /* --- RSVP --- */
  rsvpBy: "30 October 2026",
  /* OPTIONAL: paste a Formspree endpoint (e.g. "https://formspree.io/f/xxxx")
     and guest RSVPs will be emailed to you. Leave "" to only store locally. */
  rsvpEndpoint: "",

  /* --- ADMIN (the hidden couple-only dashboard) ---
     How to open it on the live site:
       1. Type the word  "ourday"  anywhere on the page (just type it), OR
       2. Tap/click the monogram in the footer 7 times.
     Then enter your PIN. Default PIN: 3012
     To change the PIN: open the browser console (F12) and run
       WEDDING_HASH("yourNewPin")
     then paste the printed value below. */
  adminPinHash: "b33ed571eded536f0f0bc2be4e4384055acd592fe6652a555320fdca4dbeb175",
  adminKeyword: "ourday",
};
