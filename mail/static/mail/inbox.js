document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('button').forEach(button => {
        button.onclick = function () {
            const section = this.dataset.section;
            var baseUrl = "/emails";

            if (section === "compose") {
                history.pushState({ section: section }, "", baseUrl);
                compose_email();
                send_email()


            }
            else {
                history.pushState({ section: section }, "", baseUrl + '/' + section);
                load_mailbox(section);
            }

        };

    });
    load_mailbox('inbox');
});

window.onpopstate = function (event) {
    console.log(event.state.section);
    load_mailbox(event.state.section);
}

function compose_email() {
    console.log("starting");
    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
    console.log("about to send");
    document.querySelector('#compose-form').addEventListener('submit', send_email);

};

function load_mailbox(mailbox) {

    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
    fetch(`/emails/${mailbox}`)
        .then(response => response.json())
        .then(emails => {
            // ... do something else with emails ...

            emails.forEach((email) => {
                const element = document.createElement('div');
                element.setAttribute("id", "singleEmail");
                document.querySelector('#emails-view').append(element);
                element.textContent = `${email.recipients}             ${email.subject}              ${email.timestamp}`
                
            });

        });

};

function send_email(event) {
    event.preventDefault();
    fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
            recipients: document.querySelector('#compose-recipients').value,
            subject: document.querySelector('#compose-subject').value,
            body: document.querySelector('#compose-body').value
        })
    })
        .then(response => response.json())
        .catch(error => {
            console.log('Error:', error);
        });

    load_mailbox('sent');
};


