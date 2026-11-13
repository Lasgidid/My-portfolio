// All the words on the site live here. Edit this file to update the portfolio.

export const profile = {
  name: "Samuel Agbalaya",
  location: "Ikorodu, Lagos",
  email: "samuelagbalaya1@gmail.com",
  phone: "+234 912 382 9829",
  github: "https://github.com/Lasgidid",
  linkedin: "https://www.linkedin.com/in/agbalaya-samuel-gmnse-75b2b1176/",
  twitter: "https://x.com/Agbalayadami",
};

// The story, in order. Each block is one scroll "chapter".
export const story = {
  intro: {
    title: "Samuel Agbalaya",
    text: "I studied how signals travel through wires. Now I build the websites people see on the other end.",
    hint: "Scroll, and I'll tell you how I got here.",
  },
  chapters: [
    {
      tag: "Where it started",
      title: "It started with circuits.",
      text: "I studied Electronics and Telecommunication Engineering. Long hours with circuit boards, a soldering iron and a multimeter taught me patience. When something doesn't work, you don't guess. You trace it, one connection at a time, until you find the fault.",
    },
    {
      tag: "The switch",
      title: "Then I wanted to build things people could actually use.",
      text: "Hardware showed me how systems work. The web let me put them in people's hands. I learned JavaScript and React, then Node.js, Express and PHP, one project at a time, and started taking on freelance work.",
      aside: "Since then I've built and freelanced on a lot of projects. Here are a few of them.",
    },
  ],
  playground: {
    tag: "Try it",
    title: "Send a request to my blog's API.",
    text: "This copies the API from my blog platform: the same routes, controller and data model. It runs in your browser, so nothing here touches a real database. Pick a request, send it, and watch it travel through the app.",
  },
  msc: {
    tag: "What's next",
    title: "Next, I'm going back to the classroom.",
    text: "I'm heading into an M.Sc. in Information Technology at Ajayi Crowther University. I want to understand the infrastructure under the websites I build, and how large digital projects are delivered, so I can grow into leading technical teams.",
  },
  skills: {
    tag: "What I work with",
    title: "Every job left me with a new tool.",
    groups: [
      ["Front end", "React, JavaScript, HTML, CSS, Bootstrap, mobile-first and accessible design"],
      ["Back end", "Node.js, Express, PHP, REST APIs, authentication"],
      ["Data", "MongoDB, MySQL"],
      ["Platforms", "WordPress, Git, GitHub, Vercel, Netlify"],
      ["Networks", "Cisco CCNA I and II, Introduction to IoT"],
    ],
  },
  contact: {
    tag: "Get in touch",
    title: "If you have something worth building, I'd like to hear about it.",
    text: "A lot of my best work started with one message from someone with an idea. I take on freelance websites and apps, and I'm open to full-time roles. Send me an email and I'll get back to you.",
  },
};

// "live" and "code" are optional. Leave one as "" to hide its link.
export const projects = [
  {
    title: "Labile Consults",
    kind: "Client website, team lead",
    description:
      "The website for a media and creative company that runs its own media brands and does creative work for clients. I led the team of UI/UX, backend and frontend developers and built the front end myself.",
    tech: "React, responsive layout",
    live: "https://labileconsults.com/",
    code: "",
    color: "#c98a4b",
    url: "labileconsults.com",
  },
  {
    title: "Library Management System",
    kind: "Full-stack web app",
    description:
      "Separate dashboards for admins and readers. Admins add, edit and remove books; readers browse the catalogue and open book details. Both sign in, and a PHP API stores everything in MySQL.",
    tech: "PHP, MySQL, JavaScript",
    live: "https://library-project-git-master-agbalaya-samuels-projects.vercel.app",
    code: "https://github.com/Lasgidid/library-project",
    color: "#7fb3c4",
    url: "library-project.vercel.app",
  },
  {
    title: "Blog platform",
    kind: "Node.js back end",
    description:
      "A server-rendered blog built the MVC way. Express handles the routes, Handlebars renders the pages, and MongoDB stores posts and users. Passwords are hashed with bcrypt, and sessions are stored in the database.",
    tech: "Node.js, Express, MongoDB, Handlebars",
    live: "",
    code: "https://github.com/Lasgidid/blog-mvc-hbs",
    color: "#d8c167",
    url: "github.com/Lasgidid/blog-mvc-hbs",
  },
  {
    title: "Innoson Motors website",
    kind: "Multi-page React site",
    description:
      "A site for a Nigerian vehicle maker, with a page for every model line (SUVs, MPVs, buses and pickups) plus about, blog and contact pages, all wired together with React Router.",
    tech: "React 19, React Router",
    live: "",
    code: "https://github.com/Lasgidid/innoson-web",
    color: "#93bf8c",
    url: "github.com/Lasgidid/innoson-web",
  },
  {
    title: "Attendance system",
    kind: "Plain JavaScript app",
    description:
      "A small tool for taking a class register: add students, mark each one present or absent, and see the list update. No framework, just HTML, CSS and JavaScript.",
    tech: "HTML, CSS, JavaScript",
    live: "",
    code: "https://github.com/Lasgidid/attendance-system",
    color: "#e0866a",
    url: "github.com/Lasgidid/attendance-system",
  },
];
