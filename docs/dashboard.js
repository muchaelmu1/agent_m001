/* ==========================================
SERVEAI DASHBOARD
Corrected Dashboard JavaScript
========================================== */

"use strict";

/* ==========================================

1. ELEMENT REFERENCES
   ========================================== */

const dropdown_menu =
document.getElementById("user-menu-btn");

const dropdown_list =
document.getElementById("user-dropdown");

const menu_button =
document.getElementById("menu-btn");

const sidebar =
document.querySelector(".sidebar");

const logout_btn =
document.getElementById("logout-btn");

const subscribe_container =
document.querySelector(".subscription_container");

const modal_overlay =
document.querySelector(".modal-overlay");

const show_subscription =
document.getElementById("show");

const subscribe_button =
document.getElementById("subscribe");

const agent_filter =
document.getElementById("agent-filter");

const active_count =
document.getElementById("active-count");

/* ==========================================
2. USER DROPDOWN
========================================== */

function closeUserDropdown(){

if (!dropdown_list) return;

dropdown_list.classList.add("hidden");

if (dropdown_menu){
dropdown_menu.setAttribute(
"aria-expanded",
"false"
);
}
}

function openUserDropdown(){

if (!dropdown_list) return;

dropdown_list.classList.remove("hidden");

if (dropdown_menu){
dropdown_menu.setAttribute(
"aria-expanded",
"true"
);
}
}

if (dropdown_menu && dropdown_list){

dropdown_menu.addEventListener("click", function(event){

event.stopPropagation();

const is_open =
  !dropdown_list.classList.contains("hidden");

if (is_open){
  closeUserDropdown();
}else{
  openUserDropdown();
}

});

}

document.addEventListener("click", function(event){

if (
dropdown_list &&
dropdown_menu &&
!dropdown_list.contains(event.target) &&
!dropdown_menu.contains(event.target)
){

closeUserDropdown();

}

});

/* ==========================================
3. MOBILE SIDEBAR
========================================== */

function closeSidebar(){

if (!sidebar) return;

sidebar.classList.remove("active");

if (menu_button){
menu_button.setAttribute(
"aria-expanded",
"false"
);
}

}

function toggleSidebar(){

if (!sidebar) return;

const is_open =
sidebar.classList.contains("active");

sidebar.classList.toggle(
"active",
!is_open
);

if (menu_button){
menu_button.setAttribute(
"aria-expanded",
!is_open ? "true" : "false"
);
}

}

if (menu_button){

menu_button.addEventListener(
"click",
function(event){

  event.stopPropagation();

  toggleSidebar();

}

);

}

/* ==========================================
4. LOGOUT
========================================== */

if (logout_btn){

logout_btn.addEventListener(
"click",
function(event){

  event.preventDefault();

  localStorage.removeItem("token");
  localStorage.removeItem("user");

  window.location.href = "./auth.html";

}

);

}

/* ==========================================
5. DASHBOARD NAVIGATION
========================================== */

const nav_items =
document.querySelectorAll(".nav-item");

const dashboard_sections =
document.querySelectorAll(".dashboard-section");

function showSection(section_name){

if (!section_name) return;

let found = false;

nav_items.forEach(function(nav){

const active =
  nav.dataset.section === section_name;

nav.classList.toggle(
  "active",
  active
);

});

dashboard_sections.forEach(function(section){

const target =
  section.id === `${section_name}-section`;

section.classList.toggle(
  "active",
  target
);

if (target){
  found = true;
}

});

if (found){

closeSidebar();
closeUserDropdown();

try{

  history.replaceState(
    null,
    "",
    `#${section_name}`
  );

}catch(error){

  console.warn(
    "Could not update URL:",
    error
  );

}

}

}

nav_items.forEach(function(item){

item.addEventListener(
"click",
function(event){

  event.preventDefault();

  const section_name =
    item.dataset.section;

  showSection(section_name);

}

);

});

/* ==========================================
6. RESTORE SECTION FROM URL
========================================== */

function loadInitialSection(){

const hash =
window.location.hash.replace("#","");

if (
hash &&
document.getElementById("${hash}-section")
){

showSection(hash);

}

}

loadInitialSection();

/* ==========================================
7. USER INFORMATION
========================================== */

function loadUser(){

try{

const saved_user =
  localStorage.getItem("user");

if (!saved_user) return;

const user =
  JSON.parse(saved_user);

const user_name =
  document.getElementById("user-name");

const user_avatar =
  document.getElementById("user-avatar");


const display_name =
  user.username ||
  user.name ||
  user.email ||
  "User";


if (user_name){

  user_name.textContent =
    display_name;

}


if (user_avatar){

  user_avatar.textContent =
    display_name
      .charAt(0)
      .toUpperCase();

}

}catch(error){

console.error(
  "Unable to load user:",
  error
);

}

}

loadUser();

/* ==========================================
8. AGENT DATA
========================================== */

const agents = [

{
id:"AGENT-03",
name:"Operations Agent",
status:"Online",
tasks:312
},

{
id:"AGENT-07",
name:"Support Agent",
status:"Online",
tasks:289
},

{
id:"AGENT-11",
name:"Resolution Agent",
status:"Online",
tasks:246
}

];

/* ==========================================
9. AGENT CREATION
========================================== */

const btn_primary =
document.getElementById("btn_primary");

if (btn_primary){

btn_primary.addEventListener(
"click",
function(event){

  event.preventDefault();

  const add_agent =
    document.getElementById("add_agent");

  if (!add_agent) return;

  add_agent.style.display = "flex";

  const input =
    document.getElementById("agent_id");

  if (input){
    input.focus();
  }

}

);

}

const create_agent =
document.getElementById("create_agent");

function createAgent(agent_id){

const add_agent =
document.getElementById("add_agent");

if (!add_agent) return;

add_agent.innerHTML = "";

const message =
document.createElement("p");

message.textContent =
"Creating agent, please wait...";

add_agent.appendChild(message);

setTimeout(function(){

message.textContent =
  "Success! Agent created successfully.";

message.style.color =
  "var(--success)";


const selector =
  document.getElementById("agent-filter");


if (selector){

  const exists =
    Array.from(
      selector.options
    ).some(
      option =>
        option.value ===
        `AGENT-${agent_id}`
    );


  if (!exists){

    const new_option =
      document.createElement("option");

    new_option.value =
      `AGENT-${agent_id}`;

    new_option.textContent =
      `AGENT-${agent_id}`;

    selector.appendChild(
      new_option
    );

  }

}


if (active_count){

  active_count.textContent =
    agents.length;

}


setTimeout(function(){

  add_agent.style.display =
    "none";

  add_agent.innerHTML = "";

},1500);

},1200);

}

if (create_agent){

create_agent.addEventListener(
"click",
function(event){

  event.preventDefault();

  const input =
    document.getElementById("agent_id");

  if (!input) return;

  const agent_id =
    input.value.trim();


  if (!agent_id){

    alert(
      "Please enter an agent number."
    );

    input.focus();

    return;

  }


  createAgent(agent_id);

}

);

}

/* ==========================================
10. RENDER AGENTS
========================================== */

function renderAgents(){

const agents_grid =
document.getElementById("agents-grid");

if (!agents_grid) return;

agents_grid.innerHTML = "";

agents.forEach(function(agent){

const card =
  document.createElement("div");

card.className =
  "agent-card";


card.innerHTML = `

  <div class="integration-icon">
    🤖
  </div>

  <h3>${agent.id}</h3>

  <p class="card-muted">
    ${agent.name}
  </p>

  <p class="integration-status">
    ● ${agent.status}
  </p>

  <p class="card-muted">
    ${agent.tasks} tasks processed
  </p>

  <div class="card-actions">

    <button
      class="btn-ghost agent-configure"
      type="button"
      data-agent="${agent.id}">
      Configure
    </button>

    <button
      class="btn-primary agent-logs"
      type="button"
      data-agent="${agent.id}">
      View Logs
    </button>

  </div>

`;


agents_grid.appendChild(card);

});

}

renderAgents();

/* ==========================================
11. AGENT BUTTONS
========================================== */

document.addEventListener(
"click",
function(event){

const configure_button =
  event.target.closest(
    ".agent-configure"
  );


if (configure_button){

  const agent_id =
    configure_button.dataset.agent;

  configureAgent(agent_id);

  return;

}


const logs_button =
  event.target.closest(
    ".agent-logs"
  );


if (logs_button){

  const agent_id =
    logs_button.dataset.agent;

  viewAgentLogs(agent_id);

  return;

}

}
);

function configureAgent(agent_id){

const agent =
agents.find(
item => item.id === agent_id
);

if (!agent) return;

alert(
"Configure ${agent.id}\n\n" +
"Name: ${agent.name}\n" +
"Status: ${agent.status}\n" +
"Tasks processed: ${agent.tasks}\n\n" +
"Agent configuration can be connected to your backend later."
);

}

function viewAgentLogs(agent_id){

if (agent_filter){

agent_filter.value =
  agent_id;

agent_filter.dispatchEvent(
  new Event("change")
);

}

showSection("activity");

const log_body =
document.getElementById(
"dashboard-log-body"
);

if (log_body){

log_body.scrollTop = 0;

}

}

/* ==========================================
12. TASK DATA
========================================== */

const tasks = [

{
id:"TASK-1042",
agent:"AGENT-03",
type:"Email",
description:"Customer request processed",
status:"Resolved"
},

{
id:"TASK-1043",
agent:"AGENT-07",
type:"Support",
description:"Support ticket being processed",
status:"Working"
},

{
id:"TASK-1044",
agent:"AGENT-11",
type:"Billing",
description:"Subscription verification",
status:"Resolved"
},

{
id:"TASK-1045",
agent:"AGENT-03",
type:"Escalation",
description:"Human review required",
status:"Escalated"
}

];

/* ==========================================
13. RENDER TASKS
========================================== */

function renderTasks(){

const task_list =
document.getElementById(
"task-list"
);

const table_body =
document.getElementById(
"tasks-table-body"
);

if (task_list){

task_list.innerHTML = "";


tasks.forEach(function(task){

  const item =
    document.createElement("div");

  item.className =
    "task-item";


  item.innerHTML = `

    <span class="task-id">
      ${task.id}
    </span>

    <span class="task-type">
      ${task.agent}
    </span>

    <span class="task-description">
      ${task.description}
    </span>

    <span class="task-status ${task.status.toLowerCase()}">
      ${task.status}
    </span>

  `;


  task_list.appendChild(item);

});

}

if (table_body){

table_body.innerHTML = "";


tasks.forEach(function(task){

  const row =
    document.createElement("tr");


  row.innerHTML = `

    <td>${task.id}</td>

    <td>${task.agent}</td>

    <td>${task.type}</td>

    <td>${task.status}</td>

    <td>Today</td>

    <td>

      <button
        class="btn-ghost task-view"
        type="button"
        data-task="${task.id}">
        View
      </button>

    </td>

  `;


  table_body.appendChild(row);

});

}

}

renderTasks();

/* ==========================================
14. TASK VIEW BUTTONS
========================================== */

document.addEventListener(
"click",
function(event){

const button =
  event.target.closest(
    ".task-view"
  );

if (!button) return;


const task_id =
  button.dataset.task;


const task =
  tasks.find(
    item => item.id === task_id
  );


if (!task) return;


alert(
  `Task: ${task.id}\n\n` +
  `Agent: ${task.agent}\n` +
  `Type: ${task.type}\n` +
  `Status: ${task.status}\n\n` +
  `${task.description}`
);

}
);

/* ==========================================
15. LIVE LOG DATA
========================================== */

const logs = [

{
agent:"AGENT-03",
message:"Incoming email processed",
status:"DONE"
},

{
agent:"AGENT-07",
message:"Support request assigned",
status:"WORKING"
},

{
agent:"AGENT-11",
message:"Billing verification completed",
status:"DONE"
},

{
agent:"AGENT-03",
message:"Customer notification sent",
status:"DONE"
},

{
agent:"AGENT-07",
message:"Waiting for customer response",
status:"WORKING"
}

];

/* ==========================================
16. RENDER LOGS
========================================== */

function renderLogs(){

const log_body =
document.getElementById(
"dashboard-log-body"
);

if (!log_body) return;

log_body.innerHTML = "";

logs.forEach(function(log){

addLogLine(
  log_body,
  log.agent,
  log.message,
  log.status,
  false
);

});

}

function addLogLine(
log_body,
agent,
message,
status,
prepend = true
){

const line =
document.createElement("div");

line.className =
"log-line";

const time =
new Date().toLocaleTimeString(
[],
{
hour:"2-digit",
minute:"2-digit",
second:"2-digit"
}
);

let status_class =
"working";

if (status === "DONE"){
status_class = "done";
}

if (status === "FLAG"){
status_class = "flag";
}

line.innerHTML = `

<span class="ts">
  ${time}
</span>

<span class="agent">
  ${agent}
</span>

<span class="log-message">
  ${message}
</span>

<span class="status ${status_class}">
  ${status}
</span>

`;

if (prepend){

log_body.prepend(line);

}else{

log_body.appendChild(line);

}

}

renderLogs();

/* ==========================================
17. AUTOMATIC LIVE LOG
========================================== */

const live_agents = [
"AGENT-03",
"AGENT-07",
"AGENT-11"
];

const live_messages = [

"Task received",
"Processing request",
"Database record updated",
"Customer notification sent",
"Task completed"

];

setInterval(function(){

const log_body =
document.getElementById(
"dashboard-log-body"
);

if (!log_body) return;

const random_agent =
live_agents[
Math.floor(
Math.random() *
live_agents.length
)
];

const random_message =
live_messages[
Math.floor(
Math.random() *
live_messages.length
)
];

addLogLine(
log_body,
random_agent,
random_message,
"DONE",
true
);

while (
log_body.children.length > 30
){

log_body.removeChild(
  log_body.lastChild
);

}

applyAgentFilter();

},5000);

/* ==========================================
18. AGENT FILTER
========================================== */

function applyAgentFilter(){

const log_body =
document.getElementById(
"dashboard-log-body"
);

if (!log_body) return;

const selected =
agent_filter
? agent_filter.value
: "";

const all_logs =
log_body.querySelectorAll(
".log-line"
);

all_logs.forEach(function(line){

const agent =
  line.querySelector(".agent");


if (
  !selected ||
  (
    agent &&
    agent.textContent.trim() ===
    selected
  )
){

  line.style.display =
    "flex";

}else{

  line.style.display =
    "none";

}

});

}

if (agent_filter){

agent_filter.addEventListener(
"change",
applyAgentFilter
);

}

/* ==========================================
19. ACTIVE AGENT COUNT
========================================== */

if (active_count){

active_count.textContent =
agents.length;

}

/* ==========================================
20. SUBSCRIPTION MODAL
========================================== */

function openSubscription(){

if (!subscribe_container) return;

subscribe_container.classList.add(
"active"
);

if (modal_overlay){

modal_overlay.classList.add(
  "active"
);

}

document.body.classList.add(
"modal-open"
);

closeSidebar();
closeUserDropdown();

}

function closeSubscription(){

if (subscribe_container){

subscribe_container.classList.remove(
  "active"
);

}

if (modal_overlay){

modal_overlay.classList.remove(
  "active"
);

}

document.body.classList.remove(
"modal-open"
);

}

if (show_subscription){

show_subscription.addEventListener(
"click",
function(event){

  event.preventDefault();

  openSubscription();

}

);

}

/* ==========================================
21. CLOSE SUBSCRIPTION
========================================== */

if (modal_overlay){

modal_overlay.addEventListener(
"click",
closeSubscription
);

}

const subscription_close =
document.querySelector(
".subscription-close"
);

if (subscription_close){

subscription_close.addEventListener(
"click",
function(event){

  event.preventDefault();

  closeSubscription();

}

);

}

/* ==========================================
22. ESCAPE KEY
========================================== */

document.addEventListener(
"keydown",
function(event){

if (event.key === "Escape"){

  closeUserDropdown();
  closeSidebar();
  closeSubscription();

}

}
);

/* ==========================================
23. SUBSCRIPTION PURCHASE
========================================== */

if (subscribe_button){

subscribe_button.addEventListener(
"click",
async function(event){

  event.preventDefault();


  const phone_input =
    document.getElementById(
      "phone_number"
    );


  const package_input =
    document.getElementById(
      "subscription"
    );


  const phone =
    phone_input
      ? phone_input.value.trim()
      : "";


  const package_amount =
    package_input
      ? package_input.value
      : "";


  if (!phone){

    alert(
      "Please enter your M-Pesa phone number."
    );

    if (phone_input){
      phone_input.focus();
    }

    return;

  }


  if (!package_amount){

    alert(
      "Please choose a package."
    );

    if (package_input){
      package_input.focus();
    }

    return;

  }


  subscribe_button.disabled =
    true;

  subscribe_button.textContent =
    "Processing...";


  try{

    const response =
      await fetch(
        "https://serveai-2.onrender.com/api/subscription/stkpush",
        {
          method:"POST",

          headers:{
            "Content-Type":
              "application/json"
          },

          body:JSON.stringify({

            phone:phone,

            amount:Number(
              package_amount
            )

          })

        }
      );


    let result = {};

    try{

      result =
        await response.json();

    }catch(json_error){

      result = {};

    }


    if (!response.ok){

      throw new Error(
        result.message ||
        "Subscription request failed."
      );

    }


    alert(
      result.message ||
      "STK Push sent. Check your phone."
    );


  }catch(error){

    console.error(
      "Subscription error:",
      error
    );


    alert(
      error.message ||
      "Unable to process subscription."
    );


  }finally{

    subscribe_button.disabled =
      false;

    subscribe_button.textContent =
      "Purchase";

  }

}

);

}

/* ==========================================
24. EMAIL CONNECTION
========================================== */

function connectEmail(){

alert(
"Email connection selected.\n\n" +
"Connect your email provider through the backend."
);

}

/* ==========================================
25. BILLING CONNECTION
========================================== */

function connectBilling(){

alert(
"Billing connection selected.\n\n" +
"Connect M-Pesa, Stripe, or another payment provider through the backend."
);

}

/* ==========================================
26. TEAM MANAGEMENT
========================================== */

function addTeamMember(){

const email =
prompt(
"Enter the team member's email:"
);

if (!email) return;

const valid_email =
/^[^\s@]+@[^\s@]+.[^\s@]+$/;

if (!valid_email.test(email)){

alert(
  "Please enter a valid email address."
);

return;

}

alert(
"${email} has been added to the team invitation list."
);

}

/* ==========================================
27. CLOSE SIDEBAR WHEN CLICKING MAIN AREA
========================================== */

document.addEventListener(
"click",
function(event){

if (!sidebar) return;

if (
  window.innerWidth <= 968 &&
  sidebar.classList.contains("active") &&
  !sidebar.contains(event.target) &&
  event.target !== menu_button
){

  closeSidebar();

}

}
);

/* ==========================================
28. CONSOLE STARTUP
========================================== */

console.log(
"%cServeAI Dashboard loaded successfully.",
"color:#5EEAD4;font-weight:bold;"
);