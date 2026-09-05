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
