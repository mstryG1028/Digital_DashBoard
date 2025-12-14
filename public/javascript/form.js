const radios = document.querySelectorAll('input[name="passdown"]');
const agentName = document.getElementById("agentName");
const ticketNumber = document.getElementById("ticketNumber");
const providerType = document.getElementById("providerType");

// for Passdown
radios.forEach((radio) => {
  radio.addEventListener("change", setPassdownDisplay);
});

function setPassdownDisplay() {
  const selected = document.querySelector(
    'input[name="passdown"]:checked'
  ).value;
  if (selected == "Yes") {
    agentName.style.display = "contents";
    ticketNumber.style.display = "contents";
  } else if (selected == "No") {
    agentName.style.display = "none";
    ticketNumber.style.display = "contents";
  }
}
setPassdownDisplay();

//for Status



const statusVal = document.querySelectorAll('input[name="status"]');

const comment = document.getElementById("comment");
const followUpDate = document.getElementById("followUpDate");
const attemptedDate = document.getElementById("attemptedDate");
const attemptStatus = document.getElementById("attemptStatus");
const attemptedNumber = document.getElementById("attemptNumber");
const pendingDetails = document.getElementById("pendingDetails");
const csTicketNumber = document.getElementById("csTicketNumber");
const multiCheckList = document.getElementById("multiCheckList");
const issueEscalatedTo = document.getElementById("issueEscalatedTo");
const issueTimeStamp = document.getElementById("issueTimeStamp");

statusVal.forEach((radio) => {
  radio.addEventListener("change", setStatusDisplay);
});
function setStatusDisplay() {
  const selected = document.querySelector('input[name="status"]:checked').value;
  console.log(selected);
  if (selected == "Open" || selected == "Resolved") {
    comment.style.display = "contents";
    followUpDate.style.display = "none";
    attemptedDate.style.display = "none";
    attemptStatus.style.display = "none";
    pendingDetails.style.display = "none";
    attemptedNumber.style.display = "none";
    followUpDate.style.display = "none";
    issueTimeStamp.style.display = "none";
    issueEscalatedTo.style.display = "none";
    multiCheckList.style.display = "none";
    csTicketNumber.style.display="none"
  } else if (selected == "Pending") {
    comment.style.display = "contents";
    followUpDate.style.display = "contents";
    attemptedDate.style.display = "contents";
    attemptStatus.style.display = "contents";
    pendingDetails.style.display = "contents";
    attemptedNumber.style.display = "contents";
    followUpDate.style.display = "contents";
    issueTimeStamp.style.display = "contents";
    issueEscalatedTo.style.display = "contents";
    multiCheckList.style.display = "contents";
    csTicketNumber.style.display="contents"
  }
}
setStatusDisplay();

// for device type
const deviceType = document.querySelectorAll('input[name="deviceType"]');

const xumoTv = document.getElementById("xumoTv");
const xumoStreamBox = document.getElementById("xumoStreamBox");

deviceType.forEach((radio) => {
  radio.addEventListener("change", setDeviceTypeDisplay);
});

function setDeviceTypeDisplay() {
  const selected = document.querySelector(
    'input[name="deviceType"]:checked'
  ).value;
  console.log(selected);
  if (selected == "xumoStreamBox") {
    providerType.style.display="contents";
    xumoStreamBox.style.display = "contents";
    xumoTv.style.display = "none";
  } else if (selected == "xumoTv") {
        providerType.style.display="contents";
    xumoStreamBox.style.display = "none";
    xumoTv.style.display = "contents";
  }else{
            providerType.style.display="none";
    xumoStreamBox.style.display = "none";
    xumoTv.style.display = "none";
  }
}
setDeviceTypeDisplay();




 searchBtn.addEventListener('click', async () => {
  const ticketNumber = ticketInput.value.trim();
  searchMessage.textContent = '';

  if (!ticketNumber) {
    searchMessage.textContent = "Please enter a ticket number!";
    return;
  }

  try {
    // Call the new check-ticket route
    const response = await fetch(`/check-ticket/${encodeURIComponent(ticketNumber)}`);
    const data = await response.json();

    if (data.exists) {
      // Only redirect if ticket exists
      window.location.href = `/form/${encodeURIComponent(ticketNumber)}`;
    } else {
      searchMessage.textContent = "Ticket not found!";
    }
  } catch (err) {
    console.error(err);
    searchMessage.textContent = "Error checking ticket!";
  }
});


const allFormSearchBtn=document.getElementById("allFormSearchBtn");
 allFormSearchBtn.addEventListener('click', async () => {
  const ticketNumber = ticketInput.value.trim();
  searchMessage.textContent = '';

  if (!ticketNumber) {
    searchMessage.textContent = "Please enter a ticket number!";
    return;
  }

  try {
    // Call the new check-ticket route
    const response = await fetch(`/check-ticket/${encodeURIComponent(ticketNumber)}`);
    const data = await response.json();

    if (data.exists) {
      // Only redirect if ticket exists
      window.location.href = `/allForms/${encodeURIComponent(ticketNumber)}`;
    } else {
      searchMessage.textContent = "Ticket not found!";
    }
  } catch (err) {
    console.error(err);
    searchMessage.textContent = "Error checking ticket!";
  }
});
