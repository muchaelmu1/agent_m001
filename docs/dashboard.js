const API_BASE = window.__API_BASE__ || 'https://serveai-2.onrender.com/api';
const token = localStorage.getItem('serveai_token');

if (!token) {
	window.location.replace('./auth.html');
}

/* ======================================
SERVEAI DASHBOARD
Corresponding Dashboard JavaScript
====================================== */

"use strict";

/* ====================================
1. ELEMENT REFERENCES
==================================== */

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

const request = async (path, options = {}) => {
	const response = await fetch(`${API_BASE}${path}`, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
			...(options.headers || {})
		}
	});

	if (response.status === 401) {
		localStorage.removeItem('serveai_token');
		localStorage.removeItem('serveai_user');
		window.location.replace('./auth.html');
		throw new Error('Your session has expired.');
	}

	const body = await response.json().catch(() => ({}));
	if (!response.ok) throw new Error(body.error || body.message || 'Request failed');
	return body;
};

const dashboardState = { agents: [], tasks: [], activities: [] };
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({
	'&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[character]));
const formatDate = (value) => value ? new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Unknown';
const getAgentName = (task) => task.agentId?.name || task.agentId || 'Unassigned';

const setText = (id, value) => document.getElementById(id)?.replaceChildren(document.createTextNode(String(value)));

const populateFilters = () => {
	const agentOptions = dashboardState.agents.map((agent) => `<option value="${escapeHtml(agent.name)}">${escapeHtml(agent.name)}</option>`).join('');
	['agent-filter', 'log-agent-filter'].forEach((id) => {
		const select = document.getElementById(id);
		if (select) select.innerHTML = `<option value="">All Agents</option>${agentOptions}`;
	});
	const taskAgentSelect = document.getElementById('new-task-agent');
	if (taskAgentSelect) taskAgentSelect.innerHTML = `<option value="">Select an agent</option>${dashboardState.agents.filter((agent) => agent.status === 'active').map((agent) => `<option value="${escapeHtml(agent._id)}">${escapeHtml(agent.name)}</option>`).join('')}`;
	const statusSelect = document.getElementById('log-status-filter');
	if (statusSelect) statusSelect.innerHTML = '<option value="">All Status</option>' +
		['received', 'working', 'resolved', 'escalated', 'failed'].map((status) => `<option value="${status}">${status[0].toUpperCase()}${status.slice(1)}</option>`).join('');
};

const renderDashboardData = () => {
	const activeAgents = dashboardState.agents.filter((agent) => agent.status === 'active');
	const today = new Date().toDateString();
	const tasksToday = dashboardState.tasks.filter((task) => new Date(task.createdAt).toDateString() === today);
	const resolvedTasks = dashboardState.tasks.filter((task) => task.status === 'resolved');
	const completedTasks = dashboardState.tasks.filter((task) => ['resolved', 'escalated', 'failed'].includes(task.status));
	const processingTimes = completedTasks.map((task) => task.processingTime).filter((time) => Number.isFinite(time) && time >= 0);
	const averageSeconds = processingTimes.length ? Math.round(processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length / 1000) : 0;

	setText('active-agent-metric', activeAgents.length);
	setText('active-count', activeAgents.length);
	setText('tasks-today-metric', tasksToday.length);
	setText('resolution-rate-metric', completedTasks.length ? `${Math.round((resolvedTasks.length / completedTasks.length) * 100)}%` : '0%');
	setText('avg-response-metric', `${averageSeconds}s`);

	const agentsGrid = document.getElementById('agents-grid');
	if (agentsGrid) {
		agentsGrid.innerHTML = dashboardState.agents.length ? dashboardState.agents.map((agent) => `
			<article class="agent-card">
				<div class="agent-card-head"><h3>${escapeHtml(agent.name)}</h3><span>${escapeHtml(agent.status || 'unknown')}</span></div>
				<p>${escapeHtml(agent.description || agent.role || 'Operations agent')}</p>
				<small>${escapeHtml(agent.capabilities?.join(', ') || 'No capabilities configured')}</small>
			</article>
		`).join('') : '<p>No agents configured yet.</p>';
	}

	const statusFilter = document.getElementById('task-status-filter')?.value || '';
	const agentFilter = document.getElementById('agent-filter')?.value || '';
	const tasks = dashboardState.tasks.filter((task) => (!statusFilter || task.status === statusFilter) && (!agentFilter || getAgentName(task) === agentFilter));
	const rows = tasks.map((task) => `
		<tr><td>${escapeHtml(String(task._id || '').slice(-8))}</td><td>${escapeHtml(getAgentName(task))}</td>
		<td>${escapeHtml(task.type || 'general')}</td><td>${escapeHtml(task.status || 'received')}</td>
		<td>${escapeHtml(formatDate(task.createdAt))}</td><td>View</td></tr>
	`).join('');
	document.getElementById('tasks-table-body')?.replaceChildren();
	const tableBody = document.getElementById('tasks-table-body');
	if (tableBody) tableBody.innerHTML = rows || '<tr><td colspan="6">No tasks found.</td></tr>';

	const taskList = document.getElementById('task-list');
	if (taskList) taskList.innerHTML = tasks.slice(0, 5).map((task) => `
		<div class="task-item"><strong>${escapeHtml(task.title || 'Untitled task')}</strong>
		<span>${escapeHtml(task.status || 'received')} · ${escapeHtml(formatDate(task.createdAt))}</span></div>
	`).join('') || '<p>No tasks found.</p>';
};

const loadDashboardData = async () => {
	const [userResponse, agentsResponse, tasksResponse, activitiesResponse] = await Promise.all([
		request('/auth/me'), request('/agents?limit=100'), request('/tasks?limit=100'), request('/tasks/activity?limit=100')
	]);
	const user = userResponse.user || userResponse.data || {};
	dashboardState.agents = agentsResponse.data || agentsResponse.agents || [];
	dashboardState.tasks = tasksResponse.data || tasksResponse.tasks || [];
	dashboardState.activities = activitiesResponse.data || activitiesResponse.activities || [];
	populateFilters();
	const name = user.username || 'User';
	document.getElementById('user-name')?.replaceChildren(document.createTextNode(name));
	document.getElementById('user-avatar')?.replaceChildren(document.createTextNode(name.charAt(0).toUpperCase()));
	renderDashboardData();
	renderLogData();
};

const renderLogData = () => {
	const query = document.getElementById('log-search')?.value.trim().toLowerCase() || '';
	const status = document.getElementById('log-status-filter')?.value || '';
	const agent = document.getElementById('log-agent-filter')?.value.toLowerCase() || '';
	const filteredActivities = dashboardState.activities.filter((activity) => {
		const task = activity.taskId || {};
		const taskAgent = (activity.agentId?.name || 'Unassigned').toLowerCase();
		const searchable = `${activity.message || ''} ${task.title || ''} ${task.type || ''} ${taskAgent}`.toLowerCase();
		return (!query || searchable.includes(query)) && (!status || task.status === status || activity.status === status) && (!agent || taskAgent === agent);
	});
	const markup = filteredActivities.map((activity) => `
		<div class="log-line"><span class="ts">${escapeHtml(new Date(activity.timestamp || Date.now()).toLocaleTimeString())}</span>
		<span class="agent">${escapeHtml(activity.agentId?.name || 'System')}</span><span>${escapeHtml(activity.message || activity.action || 'Activity')}</span>
		<span class="status ${escapeHtml(activity.status || 'pending')}\">${escapeHtml((activity.status || 'pending').toUpperCase())}</span></div>
	`).join('') || '<p>No matching activity.</p>';
	['logs-console-body', 'dashboard-log-body'].forEach((id) => {
		const consoleBody = document.getElementById(id);
		if (consoleBody) consoleBody.innerHTML = markup;
	});
};

document.getElementById('task-status-filter')?.addEventListener('change', renderDashboardData);
document.getElementById('log-search')?.addEventListener('input', renderLogData);
document.getElementById('log-agent-filter')?.addEventListener('change', renderLogData);
document.getElementById('log-status-filter')?.addEventListener('change', renderLogData);
document.getElementById('logout-btn')?.addEventListener('click', () => {
	localStorage.removeItem('serveai_token');
	localStorage.removeItem('serveai_user');
	window.location.replace('./auth.html');
});
document.getElementById('user-menu-btn')?.addEventListener('click', () => {
	const menu = document.getElementById('user-dropdown');
	const button = document.getElementById('user-menu-btn');
	const open = menu?.classList.toggle('open') || false;
	button?.setAttribute('aria-expanded', String(open));
});
document.getElementById('menu-btn')?.addEventListener('click', () => {
	document.querySelector('.sidebar')?.classList.toggle('active');
});
document.getElementById('btn_primary')?.addEventListener('click', () => {
	document.getElementById('add_agent')?.classList.toggle('visible');
});
document.getElementById('create_agent')?.addEventListener('click', async () => {
	const input = document.getElementById('agent_id');
	const number = input?.value.trim();
	if (!number) return;
	try {
		await request('/agents', {
			method: 'POST',
			body: JSON.stringify({ name: `Agent ${number}`, role: 'assistant' })
		});
		if (input) input.value = '';
		document.getElementById('add_agent')?.classList.remove('visible');
		await loadDashboardData();
	} catch (error) {
		window.alert(`Unable to create agent: ${error.message}`);
	}
});
document.querySelectorAll('.nav-item, [data-section-link], .dropdown-item[href^="#"]').forEach((link) => link.addEventListener('click', (event) => {
	event.preventDefault();
	const section = link.dataset.section || link.dataset.sectionLink || (link.getAttribute('href') || '').replace('#', '');
	const targetSection = (section === 'profile-settings' ? 'settings' : section).replace(/-section$/, '');
	document.querySelectorAll('.dashboard-section').forEach((item) => item.classList.toggle('active', item.id === `${targetSection}-section` || item.dataset.sectionId === targetSection));
	document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.section === targetSection));
	document.querySelector('.sidebar')?.classList.remove('active');
	document.getElementById('user-dropdown')?.classList.remove('open');
}));

document.getElementById('new-task-btn')?.addEventListener('click', () => {
	document.getElementById('task-create-form')?.classList.toggle('hidden');
});
document.getElementById('cancel-task-btn')?.addEventListener('click', () => {
	document.getElementById('task-create-form')?.classList.add('hidden');
});
document.getElementById('task-create-form')?.addEventListener('submit', async (event) => {
	event.preventDefault();
	const message = document.getElementById('task-create-message');
	const title = document.getElementById('new-task-title').value.trim();
	const agentId = document.getElementById('new-task-agent').value;
	const type = document.getElementById('new-task-type').value;
	const input = document.getElementById('new-task-input').value.trim();
	const priority = document.getElementById('new-task-priority').value;
	if (!agentId || !type || !input || !title) {
		if (message) message.textContent = 'Complete all task fields first.';
		return;
	}
	if (message) message.textContent = 'Sending task to the AI agent...';
	try {
		await request('/tasks', { method: 'POST', body: JSON.stringify({ agentId, title, type, input, priority }) });
		event.target.reset();
		if (message) message.textContent = 'Task queued. The agent is processing it.';
		await loadDashboardData();
	} catch (error) {
		if (message) message.textContent = `Task failed: ${error.message}`;
	}
});

loadDashboardData().catch((error) => console.error('Dashboard loading error:', error));

const show_subscription =
document.getElementById("show");

const subscribe_button =
document.getElementById("subscribe");

const modal_overlay_button =
document.getElementById("modal_overlay_button");

const modal_overlay =
document.querySelector(".modal-overlay");

/* ... rest of file unchanged ... */
