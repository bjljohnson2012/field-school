(function () {
  var endpoint = "https://portal.fieldschool.ai/api/forms";

  function statusNode(form) {
    var node = form.querySelector("[data-form-status]");
    if (node) return node;
    node = document.createElement("p");
    node.setAttribute("data-form-status", "");
    node.className = "form-status";
    form.appendChild(node);
    return node;
  }

  function setStatus(form, text, kind) {
    var node = statusNode(form);
    node.textContent = text;
    node.dataset.kind = kind || "";
  }

  function payloadFrom(form) {
    var data = new FormData(form);
    return {
      kind: form.getAttribute("data-form") || data.get("kind"),
      name: data.get("name") || "",
      email: data.get("email") || "",
      message: data.get("message") || data.get("topic") || data.get("run") || "",
      website: data.get("website") || "",
      source: form.getAttribute("data-source") || window.location.pathname,
    };
  }

  document.addEventListener("submit", function (event) {
    var form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (!form.hasAttribute("data-form")) return;
    event.preventDefault();
    var button = form.querySelector('button[type="submit"]');
    var previous = button ? button.textContent : "";
    if (button) {
      button.disabled = true;
      button.textContent = "Sending…";
    }
    setStatus(form, "", "");
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadFrom(form)),
    })
      .then(function (res) {
        return res.json().then(function (body) {
          return { ok: res.ok, body: body };
        });
      })
      .then(function (result) {
        if (!result.ok) {
          setStatus(form, result.body.error || "That did not send. Try again.", "error");
          return;
        }
        form.reset();
        setStatus(
          form,
          form.getAttribute("data-success") || "You are on the list.",
          "ok",
        );
      })
      .catch(function () {
        setStatus(form, "That did not send. Try again in a minute.", "error");
      })
      .finally(function () {
        if (button) {
          button.disabled = false;
          button.textContent = previous;
        }
      });
  });
})();
