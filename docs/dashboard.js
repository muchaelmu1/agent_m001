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
    alert('sidebar');
    menu_button.style.alignSelf = 
      'right';
  }
});

