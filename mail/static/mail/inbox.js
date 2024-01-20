var reply = false;
document.addEventListener('DOMContentLoaded', function () {
    window.onpopstate = function (event) {
        loadMailbox(event.state.section);
    };
    
    document.querySelectorAll('button').forEach(button => {
        button.onclick = function () {
            const section = this.dataset.section;
            const baseUrl = "http://127.0.0.1:8000/emails";
            if (section === "compose") {
                history.pushState({ section: section }, "", baseUrl);
                composeEmail();
            } else {
                history.pushState({ section: section }, "", baseUrl + '/' + section);
                loadMailbox(section);
            };
        };
    });
    loadMailbox('inbox');
});

function composeEmail(email, reply) {
    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#show-email').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    if (!reply && !email) {
        document.querySelector('#compose-recipients').value = '';
        document.querySelector('#compose-subject').value = '';
        document.querySelector('#compose-body').value = '';
    } else {
        document.querySelector('#compose-body').style.color = 'black';
        document.querySelector('#compose-recipients').value = email.sender;
        document.querySelector('#compose-subject').value = `RE: ${email.subject}`;
        document.querySelector('#compose-body').value = `\n on ${email.timestamp} ${email.sender} wrote: ${email.body}`;
    }
    document.querySelector('#compose-form').addEventListener('submit', send_email);
};

function loadMailbox(mailbox) {
    // get current user
    const currentUser = document.querySelector('#user-email').textContent;
    var emailCounter = 0;
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#show-email').style.display = 'none';

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
    const mailboxName = document.querySelector('h3');
    fetch(`/emails/${mailbox}`)
        .then(response => response.json())
        .then(emails => {
            emails.forEach((email) => {
                // check counter and update the value
                if (email.read === false) {
                    emailCounter++;
                };
                document.querySelector('.badge').textContent = emailCounter;
                const emailRow = document.createElement('div');
                emailRow.setAttribute("class", "single-email");
                emailRow.setAttribute("data-id", email.id);
                const readSpan = document.createElement('span');
                readSpan.classList.add('badge', 'text-bg-info');
                emailRow.appendChild(readSpan);
                
                // check mailbox
                if (mailboxName.innerText.toLocaleLowerCase() === 'inbox' || mailboxName.innerText.toLocaleLowerCase() === 'archive') {
                    // check user
                    if (email.read === false) {
                        readSpan.textContent = "Unread";
                    } else {
                        readSpan.textContent = "Read";
                    };               
                };
                emailRow.addEventListener('click', function (event) {
                    if (email.recipients == currentUser) {
                        setTimeout(() => {
                            emailRead(emailId, true);
                        }, 500)
                    };
                    const emailId = event.target.dataset.id;
                    const baseUrl = "/emails";
                    history.replaceState({ 'emailId': emailId }, "", baseUrl + '/' + email.id);
                    document.querySelector('#emails-view').style.display = 'none';
                    document.querySelector('#show-email').style.display = 'block';
                    document.querySelector('#compose-view').style.display = 'none';
                    if (email.read === false) {
                        emailCounter--;
                    };
                    viewEmail(emailId);
                });
                emailRow.innerHTML = `${email.recipients} ${email.subject} ${email.timestamp} ${readSpan.textContent}`;
                document.querySelector('#emails-view').append(emailRow);
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
        .then(() => {
            // Delay the load_mailbox call
            setTimeout(() => {
                loadMailbox('sent');
            }, 500); // Adjust the delay as needed
        })
        .catch(error => {
            console.log('Error:', error);
        });
};

function viewEmail(id) {
    // get elements from page
    var showEmailDiv = document.querySelector('#show-email')
    var emailDetails = document.querySelector('#details');
    var emailBody = document.querySelector('#body');
    var replyBtn = document.querySelector('#reply-button');
    var archiveBtn = document.querySelector('#archive-button');
    var unarchiveBtn = document.querySelector('#unarchive-button');
    var pageHeading = document.querySelector('h3');
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
        unarchiveBtn = document.createElement('button');
        unarchiveBtn.setAttribute('id', 'unarchive-button');
        unarchiveBtn.classList.add('btn', 'btn-sm', 'btn-outline-secondary');
        showEmailDiv.append(emailDetails);
        showEmailDiv.append(replyBtn);
        showEmailDiv.append(archiveBtn);
        showEmailDiv.append(unarchiveBtn);
        replyBtn.textContent = 'Reply';
        archiveBtn.textContent = 'Archive';
        unarchiveBtn.textContent = 'Unarchive';
        document.querySelector('#show-email').append(emailBody);
    };
    fetch(`/emails/${id}`)
        .then(response => response.json())
        .then(email => {
            email = JSON.parse(JSON.stringify(email));
            emailDetails.innerText = `
            From: ${email.sender}\nTo: ${email.recipients}\nSubject: ${email.subject}\nTimestamp: ${email.timestamp}`;
            emailBody.innerText = `${email.body} \n`;
            if (pageHeading.innerText.toLocaleLowerCase() === 'sent') {
                replyBtn.style.display = 'none';
                archiveBtn.style.display = 'none';
                unarchiveBtn.style.display = 'none';
            } else {
                // change button display based on page
                if (pageHeading.innerText.toLocaleLowerCase() === 'archive') {
                    console.log('true');
                    archiveBtn.style.display = 'none';
                    unarchiveBtn.style.display = 'inline-block';
                } else {
                    unarchiveBtn.style.display = 'none';
                    archiveBtn.style.display = 'inline-block';
                };
                replyBtn.style.display = 'inline-block';
                document.querySelector('#reply-button').onclick = function () {
                    reply = true;
                    composeEmail(email, reply);
                }
                if (pageHeading.innerText.toLocaleLowerCase() === 'archive') {
                    unarchiveBtn.onclick = function () {
                        archiveEmail(id, false);
                        setTimeout(() => {
                            loadMailbox('inbox');
                        }, 500);

                    };
                } else {
                    archiveBtn.onclick = function () {
                        archiveEmail(id, true);
                        setTimeout(() => {
                            loadMailbox('archive');
                        }, 500);

                    };
                };
            };
        })
        .catch(error => {
            console.error('Error fetching email:', error);
            // Handle the error appropriately, e.g., display an error message to the user.
        });
};

function archiveEmail(id, state) {
    fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: state
        })
    });
};

function emailRead(id, state) {
    fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: state
        })
    });
};

