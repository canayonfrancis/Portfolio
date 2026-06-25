/**
 * Netlify Forms — AJAX submission with existing php-email-form UI states.
 */
(function () {
  "use strict";

  document.querySelectorAll('form[data-netlify="true"]').forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const loading = form.querySelector(".loading");
      const errorMessage = form.querySelector(".error-message");
      const sentMessage = form.querySelector(".sent-message");

      if (loading) loading.classList.add("d-block");
      if (errorMessage) errorMessage.classList.remove("d-block");
      if (sentMessage) sentMessage.classList.remove("d-block");

      const formData = new FormData(form);

      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData).toString(),
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error(response.status + " " + response.statusText);
          }
          if (loading) loading.classList.remove("d-block");
          if (sentMessage) sentMessage.classList.add("d-block");
          form.reset();
        })
        .catch(function () {
          if (loading) loading.classList.remove("d-block");
          if (errorMessage) {
            errorMessage.textContent =
              "Something went wrong. Please try again or email me directly at enzocans123@gmail.com.";
            errorMessage.classList.add("d-block");
          }
        });
    });
  });
})();
