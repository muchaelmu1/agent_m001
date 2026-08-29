const dropdown_menu = document.getElementById("user-menu-btn");

dropdown_menu.addEventListener("click", () => {
    
  const dropdown_list = document.getElementById("user-dropdown");
  if(dropdown_list){
    dropdown_list.classList.toggle('hidden');
  }
});

const menu_button = document.getElementById("menu-btn");

menu_button.addEventListener('click', () => {
  const sidebar = document.querySelector('.sidebar');
  if(sidebar){
    sidebar.classList.toggle("active");
    menu_button.style.justifySelf = 
      'right';
  }
});

const logout_btn = document.getElementById('logout-btn');

logout_btn.addEventListener('click', ()=>{
  window.location.href = './auth.html';
});
const btn_primary = document.getElementById('btn_primary');
function create(add_agent, agent_id) {
    // 1. Clear form and show loading message
    add_agent.innerHTML = '';
    const p = document.createElement('p');
    p.innerText = 'creating please wait a few seconds ';
    add_agent.appendChild(p);
    
    // 2. Wait 3 seconds for the loading state to finish
    setTimeout(() => {
        // Change text to success
        p.innerText = 'Success! Agent created successfully.';
        p.style.color = '#4caf50'; // Optional: turns the text green
        
        // 3. Wait 2 more seconds so the user can actually read the success message
       //4. Where new agent will be created and appended to selector class
        const selector = document.getElementById('agent-filter');
        const newOption = document.createElement('option');
        newOption.value = agent_id;
        newOption.innerText = `AGENT- ${agent_id}`;
        selector.appendChild(newOption);
        const count = document.getElementById('active-count');
        const active_counts = selector.options.length;
        count.innerText = active_counts;
        setTimeout(() => {
            add_agent.style.display = 'none'; // Closes the popup
        }, 2000);

    }, 3000); 
}

btn_primary.addEventListener('click', () => {
  const add_agent = document.getElementById('add_agent');
  if(add_agent){
    add_agent.style.display = 'flex';
  }
  const agent_id = document.getElementById('agent_id');
});
const create_agent = document.getElementById("create_agent");

create_agent.addEventListener('click', ()=>{
  const add_agent_id = document.getElementById('agent_id').value;
  create(add_agent, add_agent_id);
});
