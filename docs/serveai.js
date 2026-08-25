const agents = ['AGENT-03','AGENT-07','AGENT-11','AGENT-12','AGENT-19','AGENT-22','AGENT-28'];
  const tasks = [
    { t: 'resolved refund request #4821', s: 'done' },
    { t: 'synced inventory across 3 warehouses', s: 'done' },
    { t: 'matched invoice #7734 to PO-1182', s: 'done' },
    { t: 'drafted response to ticket #9042', s: 'working' },
    { t: 'flagged: policy exception needed', s: 'flag' },
    { t: 'routed billing dispute to specialist', s: 'done' },
    { t: 'checking order status for #6650', s: 'working' },
    { t: 'closed duplicate ticket #9038', s: 'done' },
    { t: 'flagged: refund exceeds auto-approval limit', s: 'flag' },
    { t: 'reconciled warehouse count, SKU-2291', s: 'done' },
    { t: 'escalated to human: contract ambiguity', s: 'flag' },
    { t: 'sent shipping delay notice to customer', s: 'done' },
  ];

  const body = document.getElementById('log-body');
  let hour = 14, min = 6, sec = 0;

  function nextTime(){
    sec += Math.floor(Math.random()*40)+10;
    if(sec >= 60){ min += Math.floor(sec/60); sec = sec % 60; }
    if(min >= 60){ hour += Math.floor(min/60); min = min % 60; }
    return `${String(hour%24).padStart(2,'0')}:${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  }

  function addLine(){
    const agent = agents[Math.floor(Math.random()*agents.length)];
    const task = tasks[Math.floor(Math.random()*tasks.length)];
    const line = document.createElement('div');
    line.className = 'log-line';
    line.innerHTML = `<span class="ts">${nextTime()}</span><span class="agent">${agent}</span><span>${task.t}</span><span class="status ${task.s}">${task.s}</span>`;
    body.insertBefore(line, body.firstChild);
    while(body.children.length > 22){ body.removeChild(body.lastChild); }
  }

  for(let i=0;i<14;i++){ addLine(); }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduceMotion){
    setInterval(addLine, 1400);
  }
