
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('button').forEach(button => {
        button.onclick = function () {
            const section = this.dataset.section;
            var baseUrl = "/emails";

            if (section === "compose") {
                history.pushState({ section: section }, "", baseUrl);
                compose_email();
            }
            else {
                history.pushState({ section: section }, "", baseUrl + '/' + section);
                load_mailbox(section);
            };

        };

    });
    // default view
    load_mailbox('inbox');
});

window.onpopstate = function (event) {
    load_mailbox(event.state.section);
    location.reload();
}

var reply = false;
function compose_email(email, reply) {
    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#show-email').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    if (!reply && !email) {
        document.querySelector('#compose-recipients').value = '';
        document.querySelector('#compose-subject').value = '';
        document.querySelector('#compose-body').value = '';
    }
    // Clear out composition fields
    else {
        document.querySelector('#compose-body').style.color = 'black';
        document.querySelector('#compose-recipients').value = email.sender;
        document.querySelector('#compose-subject').value = `RE: ${email.subject}`;
        document.querySelector('#compose-body').value = `\n on ${email.timestamp} ${email.sender} wrote: ${email.body}`;
    }
    document.querySelector('#compose-form').addEventListener('submit', send_email);
};

function load_mailbox(mailbox) {

    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#show-email').style.display = 'none';

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
    fetch(`/emails/${mailbox}`)
        .then(response => response.json())
        .then(emails => {
            // ... do something else with emails ...

            emails.forEach((email) => {
                const element = document.createElement('div');
                element.setAttribute("class", "singleEmail");
                element.setAttribute("data-id", email.id);
                element.addEventListener('click', function(event) {
                    const emailId = event.target.dataset.id;
                    const baseUrl = "/emails";
                    history.replaceState({ 'emailId': emailId }, "", baseUrl + '/' + email.id);
                    document.querySelector('#emails-view').style.display = 'none';
                    document.querySelector('#show-email').style.display = 'block';
                    document.querySelector('#compose-view').style.display = 'none';
                    view_email(emailId);    
                });
                element.innerHTML = `${email.recipients} ${email.subject} ${email.timestamp}`;
                document.querySelector('#emails-view').append(element);
            });
        });
};

function send_email(event) {
    // stop form from submission then upate
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
    // load sent folder
    load_mailbox('sent');
};


function view_email(id) {
    // get elements from page
    var emailDetails = document.querySelector('#details');
    var emailBody = document.querySelector('#body');
    var replyBtn = document.querySelector('#reply-button');
    var archiveBtn =  document.querySelector('#archive-button');
    // if not, create the elements
    if (!emailDetails && !emailBody) {
        emailDetails = document.createElement('div');
        emailDetails.setAttribute('id', 'details');
        emailBody = document.createElement('div');
        emailBody.setAttribute('id', 'body');
        replyBtn = document.createElement('button');
        replyBtn.setAttribute('id', 'reply-button');
        replyBtn.classList.add('btn', 'btn-sm', 'btn-outline-primary');
        archiveBtn = document.createElement('button');
        archiveBtn.setAttribute('id', 'archive-button');
        archiveBtn.classList.add('btn', 'btn-sm', 'btn-outline-primary');
        document.querySelector('#show-email').append(emailDetails);
        document.querySelector('#show-email').append(replyBtn);
        document.querySelector('#show-email').append(archiveBtn);
        replyBtn.textContent = 'Reply';
        archiveBtn.textContent = 'Archive';
        document.querySelector('#show-email').append(emailBody);

    };
    fetch(`/emails/${id}`)
        .then(response => response.json())
        .then(email => {
            email = JSON.parse(JSON.stringify(email));
            emailDetails.innerText = `
            From: ${email.sender}\nTo: ${email.recipients}\nSubject: ${email.subject}\nTimestamp: ${email.timestamp}`;
            emailBody.innerText = `${email.body} \n`;
            var emailH2 = document.querySelector('#user-email');
            var userEmail = emailH2.textContent;
            if (userEmail === email.sender) {
                replyBtn.style.display = 'none'
                archiveBtn.style.display = 'none'
            }
            else {
                replyBtn.style.display = 'inline-block';
                archiveBtn.style.display = 'inline-block';
                document.querySelector('#reply-button').addEventListener('click', function() {
                    reply = true;
                    compose_email(email, reply);
                });
                document.querySelector('#archive-button').addEventListener('click', function() {
                    archiveEmail(id);
                });
            };
        })
        .catch(error => {
            console.error('Error fetching email:', error);
            // Handle the error appropriately, e.g., display an error message to the user.
        });
};

function archiveEmail(id) {
    fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: true
        })
      });
};