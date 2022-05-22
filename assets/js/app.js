
const burger = document.querySelector("#burger-menu");
const ul = document.querySelector("nav ul");
const nav = document.querySelector("nav");
const scrollUp = document.querySelector("#scroll-up");
const navLink = document.querySelectorAll(".nav-link");


burger.addEventListener("click", () => {
  ul.classList.toggle("show");
});


navLink.forEach((link) =>
  link.addEventListener("click", () => {
    ul.classList.remove("show");
  })
);


scrollUp.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: "smooth",
  });
});
