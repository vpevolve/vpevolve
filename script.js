const evidence = {
  failure: {
    className: 'failure', kicker: 'Negative experience', title: 'A failure becomes a guard.',
    body: 'A conflicting SRAF width is reproduced, attributed to a minimal recipe diff, and compiled into two executable predicates. The same action class is rejected before the evaluator is called again.',
    fact: '✓ 0 paid calls for a repeated encoded failure', nodes: ['Typed edit', 'Reproduce', 'Minimal diff', 'Invariant']
  },
  success: {
    className: 'success', kicker: 'Positive experience', title: 'A gain becomes a skill.',
    body: 'A documentation-grounded structural edit improves every registered selection metric on five held-out Poly families. Its command, scope, evidence, and rollback are packaged for later use.',
    fact: '✓ MRC_MAIN_WIDTH: 1 → 0 on held-out Metal1', nodes: ['Typed edit', 'Verify gain', 'Held-out test', 'Skill']
  },
  portable: {
    className: 'portable', kicker: 'Model portability', title: 'The harness survives the actor.',
    body: 'The same executable experience is presented to three frozen language-model actors. In every case, VPEvolve reaches 100% action validity while the accumulated guards and skills remain unchanged.',
    fact: '✓ 52.4-85.7% decision accuracy across actors', nodes: ['Qwen2.5', 'Qwen3.6', 'GLM-4.7', 'One harness']
  }
};

const panel = document.querySelector('.evidence-panel');
const buttons = document.querySelectorAll('.tabs button');
for (const button of buttons) {
  button.addEventListener('click', () => {
    const item = evidence[button.dataset.path];
    buttons.forEach((candidate) => { candidate.classList.toggle('active', candidate === button); candidate.setAttribute('aria-selected', String(candidate === button)); });
    panel.className = `evidence-panel ${item.className}`;
    document.querySelector('#evidence-kicker').textContent = item.kicker;
    document.querySelector('#evidence-title').textContent = item.title;
    document.querySelector('#evidence-body').textContent = item.body;
    document.querySelector('#evidence-fact').textContent = item.fact;
    document.querySelector('#evidence-flow').innerHTML = item.nodes.map((node, index) => `<div><small>0${index + 1}</small><b>${node}</b></div>${index < item.nodes.length - 1 ? '<i>→</i>' : ''}`).join('');
  });
}

const processLayers = {
  target: { index: '01', title: 'Target layout', image: 'assets/process/target.png', color: '#8192aa', detail: 'The intended wafer geometry and the reference used to measure edge placement.' },
  mask: { index: '02', title: 'OPC mask', image: 'assets/process/mask.png', color: '#315ce8', detail: 'The corrected mask produced by the recipe before optical simulation.' },
  sraf: { index: '03', title: 'Assist features', image: 'assets/process/sraf.png', color: '#11bad0', detail: 'Sub-resolution features reshape the aerial image without printing on wafer.' },
  contour: { index: '04', title: 'Nominal contour', image: 'assets/process/contour.png', color: '#f0a11a', detail: 'The simulated wafer contour reveals where the current recipe follows—or misses—the target.' },
  pvb: { index: '05', title: 'Process variation band', image: 'assets/process/pvb.png', color: '#ec6485', detail: 'Across focus and dose corners, the band exposes sensitivity that a nominal contour can hide.' }
};

const layerButtons = document.querySelectorAll('.layer-buttons button');
for (const button of layerButtons) {
  button.addEventListener('click', () => {
    const item = processLayers[button.dataset.layer];
    layerButtons.forEach((candidate) => {
      candidate.classList.toggle('active', candidate === button);
      candidate.setAttribute('aria-selected', String(candidate === button));
    });
    const image = document.querySelector('#layer-image');
    image.src = item.image;
    image.alt = item.title;
    document.querySelector('#layer-index').textContent = `${item.index} / 05`;
    document.querySelector('#layer-title').textContent = item.title;
    document.querySelector('#layer-detail').textContent = item.detail;
    document.querySelector('#layer-color').style.background = item.color;
  });
}

const stack = document.querySelector('.hero-stack');
if (stack && window.matchMedia('(pointer: fine)').matches) {
  stack.addEventListener('pointermove', (event) => {
    const bounds = stack.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    stack.style.setProperty('--stack-rx', `${y * -7}deg`);
    stack.style.setProperty('--stack-ry', `${x * 7}deg`);
  });
  stack.addEventListener('pointerleave', () => {
    stack.style.setProperty('--stack-rx', '0deg');
    stack.style.setProperty('--stack-ry', '0deg');
  });
}
