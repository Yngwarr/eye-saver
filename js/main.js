const DEFAULT_TIME = 20 * 60 * 1000; // minutes
const COOLDOWN_TIME = 50 * 1000;

let time = 0;
let t0;

let timer_element;
let ctrl_button;
let interval_id;

let alarm_sound = new Howl({
    src: ['sfx/alarm.wav'],
    volume: 1.5,
    rate: .7,
    loop: true
});
let cooldown_sound = new Howl({
    src: ['sfx/cooldown.wav'],
    rate: .1,
    volume: .5,
    loop: true
});

function pad_digit(t) {
    return t < 10 ? `0${t}` : `${t}`
}

function time_string(t) {
    return `${(t / 60000)|0}:${pad_digit((t / 1000 % 60)|0)}`;
}

function update_text(t) {
    timer_element.innerText = time_string(t);
}

class State {
    constructor({enter, exit, button_label, text_class}) {
        this.onEnter = enter ?? null;
        this.onExit = exit ?? null;
        this.text_class = text_class ?? null;
        this.button_label = button_label ?? null;
    }
    enter() {
        if (this.text_class) {
            timer_element.classList.add(this.text_class);
        }
        if (this.button_label) {
            ctrl_button.innerText = this.button_label;
        }
        if (this.onEnter) this.onEnter();
    }
    exit() {
        if (this.text_class) {
            timer_element.classList.remove(this.text_class);
        }
        if (this.onExit) this.onExit();
    }
}

const IDLE = new State({
    enter: () => {
        time = DEFAULT_TIME;
        update_text(time);
    },
    button_label: 'Start',
});
const RUN = new State({
    enter: () => start(time),
    exit: () => clearInterval(interval_id),
    button_label: 'Pause'
});
const PAUSED = new State({
    text_class: 'pause',
    button_label: 'Continue'
});
const ALARM = new State({
    enter: () => {
        time = 0;
        alarm_sound.play();
    },
    exit: () => {
        alarm_sound.stop();
    },
    text_class: 'alarm',
    button_label: 'Snooze'
});
const COOLDOWN = new State({
    enter: () => {
        ctrl_button.disabled = true;
        cooldown_sound.play();
        start(COOLDOWN_TIME);
    },
    exit: () => {
        clearInterval(interval_id);
        cooldown_sound.stop();
        ctrl_button.disabled = false;
    },
    button_label: 'Come back soon!'
});

let state;

function switch_state(new_state) {
    if (state) state.exit();
    new_state.enter();
    state = new_state;
}

function start(t) {
    time = t;
    t0 = new Date();
    interval_id = setInterval(tick, 100);
}

function tick() {
    let t1 = new Date();
    let dt = t1 - t0;
    time -= dt;

    if (time <= 0) {
        switch_state(state == COOLDOWN ? IDLE : ALARM);
    }

    update_text(time);
    t0 = t1;
}

function ctrl() {
    let new_state;
    switch (state) {
        case IDLE: new_state = RUN; break;
        case RUN: new_state = PAUSED; break;
        case PAUSED: new_state = RUN; break;
        case ALARM: new_state = COOLDOWN; break;
    }
    switch_state(new_state);
}

function init() {
    timer_element = document.getElementById('timer');
    ctrl_button = document.getElementById('ctrl');

    ctrl_button.addEventListener('click', () => ctrl());
    window.addEventListener('keydown', (e) => {
        if (e.key !== ' ') return;
        if (e.repeat) return;
        ctrl();
    });

    switch_state(IDLE);
}
