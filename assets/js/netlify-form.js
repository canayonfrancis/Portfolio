/**
 * Netlify Forms — contact form with validation and accessible UI states.
 */
(function () {
  "use strict";

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const rules = {
    name: {
      validate: function (value) {
        const trimmed = value.trim();
        if (!trimmed) return "Please enter your full name.";
        if (trimmed.length < 2) return "Name must be at least 2 characters.";
        return "";
      },
    },
    email: {
      validate: function (value) {
        const trimmed = value.trim();
        if (!trimmed) return "Please enter your email address.";
        if (!EMAIL_PATTERN.test(trimmed)) return "Please enter a valid email address.";
        return "";
      },
    },
    subject: {
      validate: function (value) {
        const trimmed = value.trim();
        if (!trimmed) return "Please enter a subject.";
        if (trimmed.length < 3) return "Subject must be at least 3 characters.";
        return "";
      },
    },
    message: {
      validate: function (value) {
        const trimmed = value.trim();
        if (!trimmed) return "Please enter your message.";
        if (trimmed.length < 10) return "Message must be at least 10 characters.";
        return "";
      },
    },
    consent: {
      validate: function (_value, input) {
        return input.checked ? "" : "Please confirm that I may contact you about this inquiry.";
      },
    },
  };

  const form = document.getElementById("contact-form");
  if (!form) return;

  const formBody = document.getElementById("contact-form-body");
  const successPanel = document.getElementById("contact-success");
  const resetButton = document.getElementById("contact-reset");
  const submitButton = document.getElementById("contact-submit");
  const loadingBanner = document.getElementById("contact-loading");
  const errorBanner = document.getElementById("contact-error");

  const fields = {
    name: form.querySelector("#contact-name"),
    email: form.querySelector("#contact-email"),
    subject: form.querySelector("#contact-subject"),
    message: form.querySelector("#contact-message"),
    consent: form.querySelector("#contact-consent"),
  };
  const messageCount = form.querySelector("[data-message-count]");

  function getErrorElement(input) {
    return document.getElementById(input.getAttribute("aria-describedby").split(" ")[0]);
  }

  function setFieldError(input, message) {
    const errorEl = getErrorElement(input);
    const isInvalid = Boolean(message);

    input.classList.toggle("contact-form__input--invalid", isInvalid);
    input.setAttribute("aria-invalid", isInvalid ? "true" : "false");
    errorEl.textContent = message;
  }

  function clearFieldError(input) {
    setFieldError(input, "");
  }

  function validateField(input) {
    const rule = rules[input.name];
    if (!rule) return true;

    const message = rule.validate(input.value, input);
    setFieldError(input, message);
    return !message;
  }

  function validateForm() {
    let isValid = true;
    let firstInvalid = null;

    Object.values(fields).forEach(function (input) {
      if (!validateField(input)) {
        isValid = false;
        if (!firstInvalid) firstInvalid = input;
      }
    });

    if (firstInvalid) firstInvalid.focus();
    return isValid;
  }

  function setLoading(isLoading) {
    form.setAttribute("aria-busy", isLoading ? "true" : "false");
    submitButton.disabled = isLoading;
    submitButton.classList.toggle("is-loading", isLoading);
    loadingBanner.hidden = !isLoading;
  }

  function showError(message) {
    errorBanner.textContent = message;
    errorBanner.hidden = false;
  }

  function hideError() {
    errorBanner.textContent = "";
    errorBanner.hidden = true;
  }

  function showSuccess() {
    form.hidden = true;
    successPanel.hidden = false;
    successPanel.querySelector(".contact-form__success-title").focus();
  }

  function resetForm() {
    form.reset();
    Object.values(fields).forEach(clearFieldError);
    if (messageCount) messageCount.textContent = "0";
    hideError();
    setLoading(false);
    successPanel.hidden = true;
    form.hidden = false;
    fields.name.focus();
  }

  Object.values(fields).forEach(function (input) {
    input.addEventListener("blur", function () {
      if (input.value.trim() || input.classList.contains("contact-form__input--invalid")) {
        validateField(input);
      }
    });

    input.addEventListener("input", function () {
      if (input.classList.contains("contact-form__input--invalid")) {
        validateField(input);
      }
    });
  });

  if (messageCount) {
    messageCount.textContent = String(fields.message.value.length);
    fields.message.addEventListener("input", function () {
      messageCount.textContent = String(fields.message.value.length);
    });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    hideError();

    if (!validateForm()) return;

    setLoading(true);

    const formData = new FormData(form);
    formData.set("name", fields.name.value.trim());
    formData.set("email", fields.email.value.trim());
    formData.set("subject", fields.subject.value.trim());
    formData.set("message", fields.message.value.trim());

    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(formData).toString(),
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Submission failed");
        }
        setLoading(false);
        showSuccess();
      })
      .catch(function () {
        setLoading(false);
        showError(
          "Something went wrong while sending your message. Please try again or email me directly at enzocans123@gmail.com."
        );
      });
  });

  if (resetButton) {
    resetButton.addEventListener("click", resetForm);
  }

  successPanel.querySelector(".contact-form__success-title").setAttribute("tabindex", "-1");
})();
