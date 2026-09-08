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

const dashboardState = { agents: [], tasks: [], activities: [], team: { owner: null, members: [] } };
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
	const editAgentSelect = document.getElementById('edit-task-agent');
	if (editAgentSelect) editAgentSelect.innerHTML = `<option value="">Select an agent</option>${dashboardState.agents.map((agent) => `<option value="${escapeHtml(agent._id)}">${escapeHtml(agent.name)}</option>`).join('')}`;
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
		<td>${escapeHtml(formatDate(task.createdAt))}</td><td><button class="btn-ghost task-view" type="button" data-task-id="${escapeHtml(task._id)}">View</button></td></tr>
	`).join('');
	document.getElementById('tasks-table-body')?.replaceChildren();
	const tableBody = document.getElementById('tasks-table-body');
	if (tableBody) tableBody.innerHTML = rows || '<tr><td colspan="6">No tasks found.</td></tr>';

	const taskList = document.getElementById('task-list');
	if (taskList) taskList.innerHTML = tasks.slice(0, 5).map((task) => `
		<div class="task-item"><strong>${escapeHtml(task.title || 'Untitled task')}</strong>
		<span>${escapeHtml(task.status || 'received')} · ${escapeHtml(formatDate(task.createdAt))}</span></div>
	`).join('') || '<p>No tasks found.</p>';
	const taskSelect = document.getElementById('edit-task-select');
	if (taskSelect) taskSelect.innerHTML = `<option value="">Select a task</option>${dashboardState.tasks.map((task) => `<option value="${escapeHtml(task._id)}">${escapeHtml(task.title || 'Untitled task')} (${escapeHtml(task.status || 'received')})</option>`).join('')}`;
};

const renderTeam = () => {
	const owner = dashboardState.team.owner ? [{ ...dashboardState.team.owner, owner: true }] : [];
	const members = [...owner, ...dashboardState.team.members];
	setText('team-member-count', members.length);
	setText('team-pending-count', dashboardState.team.members.filter((member) => member.status === 'pending').length);
	const table = document.getElementById('team-table-body');
	if (!table) return;
	table.innerHTML = members.length ? members.map((member) => `
		<tr><td>${escapeHtml(member.name)}</td><td>${escapeHtml(member.email)}</td><td>${escapeHtml(member.owner ? 'Owner' : member.role)}</td>
		<td><span class="metric-status ${member.status === 'active' ? 'online' : ''}">● ${escapeHtml(member.status)}</span></td>
		<td>${member.owner ? '—' : `<button class="btn-ghost remove-team-member" type="button" data-member-id="${escapeHtml(member._id)}">Remove</button>`}</td></tr>
	`).join('') : '<tr><td colspan="5">No team members yet.</td></tr>';
};

const loadDashboardData = async () => {
	const [userResponse, agentsResponse, tasksResponse, activitiesResponse, teamResponse] = await Promise.all([
		request('/auth/me'), request('/agents?limit=100'), request('/tasks?limit=100'), request('/tasks/activity?limit=100'), request('/auth/team')
	]);
	const user = userResponse.user || userResponse.data || {};
	dashboardState.agents = agentsResponse.data || agentsResponse.agents || [];
	dashboardState.tasks = tasksResponse.data || tasksResponse.tasks || [];
	dashboardState.activities = activitiesResponse.data || activitiesResponse.activities || [];
	dashboardState.team = teamResponse.data || { owner: null, members: [] };
	populateFilters();
	const name = user.username || 'User';
	document.getElementById('user-name')?.replaceChildren(document.createTextNode(name));
	document.getElementById('user-avatar')?.replaceChildren(document.createTextNode(name.charAt(0).toUpperCase()));
	renderDashboardData();
	renderLogData();
	renderTeam();
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

const showTaskResult = (task) => {
	document.getElementById('task-result-panel')?.classList.remove('hidden');
	setText('task-result-title', task.title || 'Task result');
	setText('task-result-status', task.status || 'received');
	setText('task-result-message', task.status === 'working' ? 'The AI agent is processing this task...' : task.status === 'received' ? 'Task queued for processing...' : 'Processing complete.');
	const output = document.getElementById('task-result-output');
	if (output) output.textContent = task.result ? (typeof task.result === 'string' ? task.result : JSON.stringify(task.result, null, 2)) : task.error || 'No response yet.';
	const status = document.getElementById('task-result-status');
	status?.classList.toggle('resolved', task.status === 'resolved');
	status?.classList.toggle('failed', task.status === 'failed');
};

const watchTask = async (taskId) => {
	for (let attempt = 0; attempt < 30; attempt += 1) {
		const response = await request(`/tasks/${taskId}`);
		const task = response.data || response;
		showTaskResult(task);
		if (['resolved', 'escalated', 'failed'].includes(task.status)) {
			await loadDashboardData();
			return;
		}
		await new Promise((resolve) => window.setTimeout(resolve, 2000));
	}
};

const loadTaskIntoEditor = (taskId) => {
	const task = dashboardState.tasks.find((item) => item._id === taskId);
	if (!task) return;
	document.getElementById('edit-task-select').value = taskId;
	document.getElementById('edit-task-title').value = task.title || '';
	document.getElementById('edit-task-agent').value = task.agentId?._id || task.agentId || '';
	document.getElementById('edit-task-type').value = task.type || 'custom';
	document.getElementById('edit-task-priority').value = task.priority || 'normal';
	document.getElementById('edit-task-input').value = typeof task.input === 'string' ? task.input : JSON.stringify(task.input || '', null, 2);
};

document.getElementById('task-status-filter')?.addEventListener('change', renderDashboardData);
document.getElementById('log-search')?.addEventListener('input', renderLogData);
document.getElementById('log-agent-filter')?.addEventListener('change', renderLogData);
document.getElementById('log-status-filter')?.addEventListener('change', renderLogData);
document.getElementById('invite-member')?.addEventListener('click', () => document.getElementById('team-invite-form')?.classList.toggle('hidden'));
document.getElementById('cancel-team-invite')?.addEventListener('click', () => document.getElementById('team-invite-form')?.classList.add('hidden'));
document.getElementById('team-table-body')?.addEventListener('click', async (event) => {
	const button = event.target.closest('.remove-team-member');
	if (!button || !window.confirm('Remove this team member?')) return;
	try {
		await request(`/auth/team/${button.dataset.memberId}`, { method: 'DELETE' });
		await loadDashboardData();
	} catch (error) {
		window.alert(`Unable to remove team member: ${error.message}`);
	}
});
document.getElementById('team-invite-form')?.addEventListener('submit', async (event) => {
	event.preventDefault();
	const message = document.getElementById('team-invite-message');
	try {
		await request('/auth/team', { method: 'POST', body: JSON.stringify({
			name: document.getElementById('team-member-name').value.trim(),
			email: document.getElementById('team-member-email').value.trim(),
			role: document.getElementById('team-member-role').value
		}) });
		event.target.reset();
		if (message) message.textContent = 'Team member added.';
		await loadDashboardData();
	} catch (error) {
		if (message) message.textContent = `Unable to add member: ${error.message}`;
	}
});
document.getElementById('edit-task-select')?.addEventListener('change', (event) => loadTaskIntoEditor(event.target.value));
document.getElementById('tasks-table-body')?.addEventListener('click', (event) => {
	const button = event.target.closest('.task-view');
	if (!button) return;
	document.getElementById('task-editor-panel')?.classList.remove('hidden');
	const task = dashboardState.tasks.find((item) => item._id === button.dataset.taskId);
	if (task) showTaskResult(task);
	loadTaskIntoEditor(button.dataset.taskId);
});
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
		const response = await request('/tasks', { method: 'POST', body: JSON.stringify({ agentId, title, type, input, priority }) });
		const createdTask = response.data || response;
		showTaskResult(createdTask);
		event.target.reset();
		if (message) message.textContent = 'Task queued. The agent is processing it.';
		watchTask(createdTask._id).catch((error) => {
			if (message) message.textContent = `Unable to follow task: ${error.message}`;
		});
		loadDashboardData().catch((error) => console.error('Dashboard refresh error:', error));
	} catch (error) {
		if (message) message.textContent = `Task failed: ${error.message}`;
	}
});

document.getElementById('edit-task-btn')?.addEventListener('click', () => {
	document.getElementById('task-editor-panel')?.classList.toggle('hidden');
});
document.getElementById('close-task-editor')?.addEventListener('click', () => {
	document.getElementById('task-editor-panel')?.classList.add('hidden');
});
document.getElementById('save-task-edit')?.addEventListener('click', async () => {
	const taskId = document.getElementById('edit-task-select').value;
	const message = document.getElementById('task-edit-message');
	if (!taskId) {
		if (message) message.textContent = 'Select a task first.';
		return;
	}
	try {
		await request(`/tasks/${taskId}/status`, {
			method: 'PATCH',
			body: JSON.stringify({
				title: document.getElementById('edit-task-title').value.trim(),
				agentId: document.getElementById('edit-task-agent').value,
				type: document.getElementById('edit-task-type').value,
				priority: document.getElementById('edit-task-priority').value,
				input: document.getElementById('edit-task-input').value.trim(),
				message: 'Task details updated from dashboard'
			})
		});
		if (message) message.textContent = 'Task changes saved.';
		await loadDashboardData();
	} catch (error) {
		if (message) message.textContent = `Unable to save changes: ${error.message}`;
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
