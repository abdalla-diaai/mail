// variable to show or remove reply button
var reply = false;

// listner to load page
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

// function to handle email compose and reply
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
        if (!email.subject.startsWith('RE:')) {
            document.querySelector('#compose-subject').value = `RE: ${email.subject}`;
        } else {
            document.querySelector('#compose-subject').value = `${email.subject}`;
        };
        document.querySelector('#compose-body').value = `\n on ${email.timestamp} ${email.sender} wrote: ${email.body}`;
    }
    document.querySelector('#compose-form').addEventListener('submit', sendEmail);
};

// function to load mailbox
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
    const tableHeadingNames = ['', 'Subject', 'Time', '', ''];
    var mailboxName = document.querySelector('h3');
    const emailsList = document.createElement('table');
    emailsList.classList.add('table', 'table-striped', 'table-hover');
    const tableHeading = document.createElement('thead');
    const headingRow = document.createElement('tr');
    tableHeading.append(headingRow);
    for (var i = 0; i < 5; i++) {
        const temp = document.createElement('th');
        temp.setAttribute('scope', 'col');
        if (i === 0) {
            if (mailboxName.innerText === 'Sent') {
                temp.textContent = 'To';
            } else {
                temp.textContent = 'From';
            };
        } else {
            temp.textContent = tableHeadingNames[i];
        };
        headingRow.append(temp);
    };
    const tableBody = document.createElement('tbody');
    emailsList.append(tableHeading);
    emailsList.append(tableBody);

    fetch(`/emails/${mailbox}`)
        .then(response => response.json())
        .then(emails => {
            emails.forEach((email) => {
                // check counter and update the value
                if (email.read === false) {
                    emailCounter++;
                };
                // add email number to button
                document.querySelector('.badge').textContent = emailCounter;
                const emailRow = document.createElement('tr');
                emailRow.classList.add('single-email');
                emailRow.setAttribute('data-id', email.id);
                tableBody.append(emailRow);
                const emailSender = document.createElement('td');
                emailSender.setAttribute('class', 'email-sender');
                const emailSubject = document.createElement('td');
                const emailTimeStamp = document.createElement('td');
                const emailRead = document.createElement('td');
                emailRow.append(emailSender);
                emailRow.append(emailSubject);
                emailRow.append(emailTimeStamp);
                emailRow.append(emailRead);
                const readSpan = document.createElement('span');
                readSpan.setAttribute('id', 'email-badge');
                emailRead.append(readSpan);
                if (mailboxName.innerText === 'Sent') {
                    emailSender.textContent = email.recipients;
                }
                else {
                    emailSender.textContent = email.sender;
                };
                emailSubject.textContent = email.subject;
                emailTimeStamp.textContent = email.timestamp;
                // check mailbox
                if (mailboxName.innerText === 'Inbox' || mailboxName.innerText === 'Archive') {
                    // check user
                    if (email.read === false) {
                        readSpan.classList.add('badge', 'text-bg-info');
                        readSpan.textContent = "Unread";
                    } else {
                        readSpan.textContent = "Read";
                        readSpan.classList.add('badge', 'text-bg-light');
                    };
                };
                document.querySelector('#emails-view').append(emailsList);

                emailRow.addEventListener('click', function (event) {
                    if (email.recipients == currentUser) {
                        setTimeout(() => {
                            MarkEmailRead(email.id, true);
                        }, 500)
                    };
                    history.replaceState({ 'email': event.target.dataset.id }, "", '/emails' + '/' + email.id);
                    document.querySelector('#emails-view').style.display = 'none';
                    document.querySelector('#show-email').style.display = 'block';
                    document.querySelector('#compose-view').style.display = 'none';
                    if (email.read === false) {
                        emailCounter--;
                    };
                   
                    viewEmail(email.id);
                });
            });
        });
};

// function to send emails
function sendEmail(event) {
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

// function to view single email
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
        emailBody = document.createElement('p');
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
            const emailDetailsText = `From: ${email.sender}\nTo: ${email.recipients}\nSubject: ${email.subject}\nTimestamp: ${email.timestamp}`;
            emailDetails.innerText = emailDetailsText;
            emailBody.innerText = `${email.body} \n`;
            if (pageHeading.innerText.toLocaleLowerCase() === 'sent') {
                replyBtn.style.display = 'none';
                archiveBtn.style.display = 'none';
                unarchiveBtn.style.display = 'none';
            } else {
                // change button display based on page
                if (pageHeading.innerText.toLocaleLowerCase() === 'archive') {
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

// function to archive emails
function archiveEmail(id, state) {
    fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: state
        })
    });
};

// function to mark emails as read
function MarkEmailRead(id, state) {
    fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: state
        })
    });
};

function boldString(str, find){
    var re = new RegExp(find, 'g');
    return str.replace(re, '<b>'+find+'</b>');
}