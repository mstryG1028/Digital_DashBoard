
// const tierVal = document.querySelectorAll('input[name="tier"]');

// const tier2=document.querySelectorAll(".tier2");

// tierVal.forEach((radio) => {
//   radio.addEventListener("change", setTierDisplay);
// });
// function setTierDisplay() {
//   const selected = document.querySelector('input[name="tier"]:checked').value;
//   console.log(selected);
//   if (selected == "tier1" ) {
//     tier2.style.display = "none";

//   } else {
//     tier2.style.display = "contents";
//   }
// }
// setTierDisplay();
const tierRadios = document.querySelectorAll('input[name="tier"]');
const tier2Elements = document.querySelectorAll(".tier2");

tierRadios.forEach(radio => {
  radio.addEventListener("change", setTierDisplay);
});

function setTierDisplay() {
  const selected = document.querySelector('input[name="tier"]:checked').value;
  console.log("Selected:", selected);

  if (selected === "1") {
    tier2Elements.forEach(el => el.style.display = "none");
  } else {
    tier2Elements.forEach(el => el.style.display = "flex");
  }
}

setTierDisplay();

