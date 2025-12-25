require('dotenv').config();
const port = process.env.PORT || 1234;
const express = require("express");
const session = require("express-session");
const app = express();

const path = require("path");
const ejs = require("ejs");
const ejsMate = require("ejs-mate");
const User = require("./models/user");
const Ticket = require("./models/ticketSchema");
const XumoChat = require("./models/xumoChat");
const multer = require("multer");

const XLSX = require("xlsx");

app.set("view engine", "ejs");
app.engine("ejs", ejsMate);

app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "/public")));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

app.use(
  session({
    secret: process.env.SESSION_SECRET|| "secret-key",
    resave: false,
    saveUninitialized: false,
  })
);
app.use((req, res, next) => {
  // with the help of this we can access userId at any ejs file

  res.locals.userId = req.session.userId;
  next();
});

const upload = multer({
  dest: "uploads/",
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.includes("excel") ||
      file.originalname.endsWith(".xlsx")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files allowed"));
    }
  },
});





app.get("/", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    /* -------- DAILY COUNTS -------- */
    const todayTicket = await Ticket.findOne({ date: today });

    const tier1Count = todayTicket ? todayTicket.tier1Count : 0;
    const tier2Count = todayTicket ? todayTicket.tier2Count : 0;

    /* -------- EXCEL TICKETS -------- */
    const excelTickets = req.session.excelTickets || [];

    /* -------- USER TICKETS -------- */
    const users = await User.find({}, { ticketNumber: 1, _id: 0 });

    // Convert to SET for fast lookup
    const userTicketSet = new Set(users.map((u) => String(u.ticketNumber)));

    /* -------- PREPARE GRID DATA -------- */
    const gridTickets = excelTickets.map((ticket) => ({
      ticketNo: ticket,
      matched: userTicketSet.has(String(ticket)),
    }));

    res.render("home", {
      tier1Count,
      tier2Count,
      gridTickets,
    });
  } catch (err) {
    console.error("HOME ERROR:", err);
    res.status(500).send("Server Error");
  }
});


app.post("/upload-excel", upload.single("excelFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.redirect("/");
    }

    /* ---------- READ EXCEL FILE ---------- */
    const workbook = XLSX.readFile(req.file.path);
   
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const excelData = XLSX.utils.sheet_to_json(sheet);

    /* ---------- EXTRACT TICKET NUMBERS ---------- */
    // Excel must have column: ticketNo
    const tickets = excelData.map((row) => row.ticketNo).filter(Boolean); // remove empty rows

    /* ---------- SAVE INTO SESSION ---------- */
    req.session.excelTickets = tickets;

    /* ---------- REDIRECT TO HOME ---------- */
    res.redirect("/");
  } catch (err) {
    console.error("EXCEL UPLOAD ERROR:", err);
    res.status(500).send("Excel upload failed");
  }
});

app.get("/reports", (req, res) => {
  res.render("reports");
});
app.get("/allForms/:ticketNumber", async (req, res) => {
  const ticketNumber = req.params.ticketNumber;
  const userDoc = await User.findOne({ ticketNumber });

  if (!userDoc || !userDoc.forms) {
    return res.render("allForms", { list: [], message: "No records found" });
  }

  const list = userDoc.forms.sort(
    (a, b) => new Date(b.issueTimeStamp) - new Date(a.issueTimeStamp)
  );

  res.render("allForms", { list, ticketNumber });
});

app.get("/export-forms", async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).send("Please provide both 'from' and 'to' dates.");
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    const usersWithForms = await User.find({
      forms: {
        $elemMatch: {
          issueTimeStamp: { $gte: fromDate, $lte: toDate },
        },
      },
    });

    if (!usersWithForms.length) {
      return res.status(404).send("No forms found in the given date range.");
    }

    let excelData = [];
    usersWithForms.forEach((user) => {
      user.forms.forEach((f) => {
        if (f.issueTimeStamp >= fromDate && f.issueTimeStamp <= toDate) {
          excelData.push({
            "Ticket Number": user.ticketNumber,
            "Agent Name": f.agentName || "",
            Status: f.status || "",
            Passdown: f.passdown || "",
            "Device Type": f.deviceType || "",
            "Provider Type": f.providerType || "",
            "Pending Details": Array.isArray(f.pendingDetails)
              ? f.pendingDetails.join(", ")
              : f.pendingDetails || "",
            "Attempt Date": f.attemptDate
              ? new Date(f.attemptDate).toLocaleString()
              : "",
            "Follow Up Date": f.followUpDate
              ? new Date(f.followUpDate).toLocaleString()
              : "",
            Comment: f.comment || "",
            "Escalated to PROD": f.isEscalatedToProd || "",
            MAC: f.mac ? "Yes" : "No",
            " Serial": f.serial ? "Yes" : "No",
            " Customer Contact": f.custContact ? "Yes" : "No",
            " Alt Contact": f.altContact ? "Yes" : "No",
            " Email": f.email ? "Yes" : "No",
            "CS Ticket Number": f.csTicketNumber || "",
            "Issue Time Stamp": f.issueTimeStamp
              ? new Date(f.issueTimeStamp).toLocaleString()
              : "",
            "Redirected to Provider": f.redirectToProvider || "",
            "Columbo Escalation": f.columboEscalation || "",
          });
        }
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "FormsInRange");

    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=formsInRange.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(excelBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error exporting Excel");
  }
});

app.get("/form", (req, res) => {
  res.render("form");
});
app.get("/xumoChat", (req, res) => {
  res.render("xumoChat");
});

app.post("/xumoChat", async (req, res) => {
  try {
    const {
      chatId,
      device,
      brand,
      type,
      subtype,
      ticketNo,
      tier,
      nameCheck,
      emailCheck,
      contactCheck,
      prefTime,
      prefDate,
      timeZone,
      MAC_Check,
      serialNo_Check,
      redirectToProd,
      comment,
    } = req.body;

    const tierNumber = Number(tier);
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    /* ---------- SAVE FULL FORM DATA ---------- */
    await XumoChat.create({
      chatId,
      device,
      brand,
      type,
      subtype,
      ticketNo,
      tier: tierNumber,

      nameCheck: nameCheck === "true",
      emailCheck: emailCheck === "true",
      contactCheck: contactCheck === "true",

      prefTime,
      prefDate,
      timeZone,

      MAC_Check: MAC_Check === "true",
      serialNo_Check: serialNo_Check === "true",

      redirectToProd,
      comment,
    });

    /* ---------- UPDATE DAILY TICKET COUNT ---------- */
    const update =
      tierNumber === 1
        ? { $inc: { tier1Count: 1 } }
        : { $inc: { tier2Count: 1 } };

    await Ticket.findOneAndUpdate({ date: today }, update, {
      upsert: true,
      new: true,
    });

    res.redirect("/");
  } catch (err) {
    console.error("XUMO CHAT ERROR:", err);
    res.status(500).send("Server Error");
  }
});

app.post("/form", async (req, res) => {
  try {
    let {
      passdown,
      agentName,
      ticketNumber,
      deviceType,
      providerType,
      status,
      pendingDetails,
      attemptNo,
      attemptStatus,
      attemptDate,
      followUpDate,
      comment,
      isEscalatedToProd,
      mac,
      serial,
      custContact,
      altContact,
      email,
      csTicketNumber,
      issueTimeStamp,
      redirectToProvider,
      columboEscalation,
    } = req.body;

    //  Handle checkboxes & array fields
    pendingDetails = pendingDetails
      ? Array.isArray(pendingDetails)
        ? pendingDetails
        : [pendingDetails]
      : [];

    //  Fix providerType if multiple selected
    if (Array.isArray(providerType)) {
      providerType = providerType.filter((v) => v).shift() || ""; // Remove empty strings & pick first
    }

    //  Convert booleans
    mac = !!mac;
    serial = !!serial;
    custContact = !!custContact;
    altContact = !!altContact;
    email = !!email;

    // Create form object
    const newForm = {
      passdown,
      agentName,
      deviceType,
      providerType,
      status,
      pendingDetails,
      attemptNo: Number(attemptNo),
      attemptStatus,
      attemptDate: attemptDate ? new Date(attemptDate) : Date.now(),
      followUpDate: followUpDate ? new Date(followUpDate) : Date.now(),
      comment,
      isEscalatedToProd,
      mac,
      serial,
      custContact,
      altContact,
      email,
      csTicketNumber: Number(csTicketNumber),
      issueTimeStamp: issueTimeStamp ? new Date(issueTimeStamp) : Date.now(),
      redirectToProvider,
      columboEscalation,
    };

    //  Find user by ticketNumber
    let currUser = await User.findOne({ ticketNumber });

    if (!currUser) {
      // If user doesn't exist, create new user
      currUser = new User({
        ticketNumber,
        forms: [newForm],
      });
    } else {
      // If user exists, push new form
      currUser.forms.push(newForm);
    }

    await currUser.save();

    //  Render success page or redirect
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving form");
  }
});

//show route
app.get("/form/:ticketNumber", async (req, res) => {
  try {
    const ticketNumber = req.params.ticketNumber;

    // Find the user document that has this ticketNumber
    const userDoc = await User.findOne({ ticketNumber });

    if (!userDoc || !userDoc.forms || userDoc.forms.length === 0) {
      // Ticket not found or no forms
      return res.render("form", { user: {}, message: "No ticket found" });
    }

    // Get the most recent form from the forms array
    // Assuming issueTimeStamp exists in each subdocument
    const latestForm = userDoc.forms.sort(
      (a, b) => b.issueTimeStamp - a.issueTimeStamp
    )[0];

    // Render edit.ejs with latestForm
    res.render("show", { user: latestForm, ticketNumber: ticketNumber });
  } catch (err) {
    console.error(err);
    res.render("form", { user: {}, message: "Error fetching ticket" });
  }
});

app.get("/form/edit/:ticketNumber", async (req, res) => {
  try {
    const ticketNumber = Number(req.params.ticketNumber);

    if (isNaN(ticketNumber)) {
      return res.status(400).send("Invalid ticket number");
    }

    const userDoc = await User.findOne({ ticketNumber });

    if (!userDoc || !userDoc.forms?.length) {
      return res.render("edit", {
        user: {},
        ticketNumber,
        message: "No ticket found",
      });
    }

    const latestForm = [...userDoc.forms].sort(
      (a, b) => new Date(b.issueTimeStamp) - new Date(a.issueTimeStamp)
    )[0];

    res.render("edit", {
      user: latestForm,
      ticketNumber,
      message: "",
    });
  } catch (err) {
    console.error(err);
    res.render("edit", {
      user: {},
      ticketNumber: "",
      message: "Error fetching ticket",
    });
  }
});

app.post("/form/edit/:ticketNumber", async (req, res) => {
  try {
    const ticketNumber = Number(req.params.ticketNumber);
    if (isNaN(ticketNumber)) return res.send("Invalid ticket number");

    const user = await User.findOne({ ticketNumber });
    if (!user) return res.send("User not found");

    const prevForm = user.forms[user.forms.length - 1] || {};

    const parseDate = (dateStr, fallback = null) => {
      if (!dateStr) return fallback;
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? fallback : d;
    };

    const newForm = {
      agentName: req.body.agentName || prevForm.agentName || "",
      passdown: req.body.passdown || prevForm.passdown || "",
      deviceType: req.body.deviceType || prevForm.deviceType || "",
      providerType: req.body.providerType || prevForm.providerType || "", // String
      status: req.body.status || prevForm.status || "",
      pendingDetails: req.body.pendingDetails
        ? [].concat(req.body.pendingDetails)
        : prevForm.pendingDetails || [],
      attemptDate: parseDate(
        req.body.attemptDate,
        prevForm.attemptDate || null
      ),
      followUpDate: parseDate(
        req.body.followUpDate,
        prevForm.followUpDate || null
      ),
      comment: req.body.comment || prevForm.comment || "",
      isEscalatedToProd:
        req.body.isEscalatedToProd || prevForm.isEscalatedToProd || "",
      mac: req.body.mac !== undefined ? !!req.body.mac : prevForm.mac || false,
      serial:
        req.body.serial !== undefined
          ? !!req.body.serial
          : prevForm.serial || false,
      custContact:
        req.body.custContact !== undefined
          ? !!req.body.custContact
          : prevForm.custContact || false,
      altContact:
        req.body.altContact !== undefined
          ? !!req.body.altContact
          : prevForm.altContact || false,
      email:
        req.body.email !== undefined
          ? !!req.body.email
          : prevForm.email || false,
      csTicketNumber: req.body.csTicketNumber || prevForm.csTicketNumber || "",
      redirectToProvider:
        req.body.redirectToProvider || prevForm.redirectToProvider || "no",
      columboEscalation:
        req.body.columboEscalation || prevForm.columboEscalation || "no",
      issueTimeStamp: new Date(),
      isEdited: true,
      // Required fields from schema
      attemptStatus:
        req.body.attemptStatus || prevForm.attemptStatus || "Pending",
      attemptNo:
        req.body.attemptNo !== undefined
          ? Number(req.body.attemptNo)
          : prevForm.attemptNo || 1,
    };

    user.forms.push(newForm);
    await user.save();

    res.render("show", { user: newForm, ticketNumber: ticketNumber });
  } catch (err) {
    console.error("Error saving edited form:", err.message);
    console.error(err);
    res.status(500).send("Error saving edited form. Check server logs.");
  }
});

// Server-side route
app.get("/check-ticket/:ticketNumber", async (req, res) => {
  try {
    const ticketNumber = req.params.ticketNumber;
    const user = await User.findOne({ ticketNumber });

    res.json({ exists: !!user }); // true if ticket found, false if not
  } catch (err) {
    console.error(err);
    res.status(500).json({ exists: false });
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});
app.post("/login", (req, res) => {
  const { id, password } = req.body;

  const Employee = [
    { id: "12345", password: "hello" },
    { id: "123456", password: "hello1" },
    { id: "1234567", password: "hello2" },
  ];

  const currEmployee = Employee.find(
    (u) => u.id === id && u.password === password
  );

  if (currEmployee) {
    req.session.userId = currEmployee.id; // store id
    req.session.save(() => {
      res.redirect("/");
    });
  } else {
    res.send("Invalid ID or password");
  }
});
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

app.listen(port, () => {
  console.log(`listening at:${port}`);
});
