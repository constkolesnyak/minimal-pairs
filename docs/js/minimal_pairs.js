import { pairs_index } from "./pairs_index.js";

const shutdownHosts = new Set(['localhost', '127.0.0.1', '[::1]']);

function hasShutdownEndpoint() {
    return shutdownHosts.has(window.location.hostname);
}

// globals
let test_started = false;
let current_correct_answer_button = -1;
let current_correct_answer = "";
let active_pitch_type = "";

let heiban_count = 0;
let correct_heiban_count = 0;
let atamadaka_count = 0;
let correct_atamadaka_count = 0;
let nakadaka_count = 0;
let correct_nakadaka_count = 0;

const percentElementIds = [
    "all-answers-percent",
    "heiban-answers-percent",
    "atamadaka-answers-percent",
    "nakadaka-answers-percent",
];

function computePercentColor(percentValue) {
    const clampedPercent = Math.max(0, Math.min(100, percentValue));
    if (clampedPercent <= 50) {
        return "hsl(0, 72%, 52%)";
    }

    const blendRatio = (clampedPercent - 50) / 50;
    const hue = Math.round(blendRatio * 120);
    return `hsl(${hue}, 68%, 45%)`;
}

function applyPercentColor(elementId, percentValue, additionalElements = []) {
    const element = document.getElementById(elementId);
    const targets = [];

    if (element) {
        targets.push(element);
    }

    for (const extraElement of additionalElements) {
        if (extraElement) {
            targets.push(extraElement);
        }
    }

    if (!targets.length) {
        return;
    }

    const color = computePercentColor(percentValue);

    for (const target of targets) {
        target.style.color = color;
    }
}

function initializePercentColors() {
    const allPatternName = document.querySelector(".patterns-table tr:first-child");

    for (const elementId of percentElementIds) {
        const element = document.getElementById(elementId);
        if (!element) {
            continue;
        }

        const numericText = parseInt(element.textContent, 10);
        const percentValue = Number.isNaN(numericText) ? 0 : numericText;
        const extras = elementId === "all-answers-percent" ? [allPatternName] : [];
        applyPercentColor(elementId, percentValue, extras);
    }
}

let shortcuts = {
    answer_button_1: {
        ctrl: false,
        shift: false,
        alt: false,
        meta: false,
        key: "1"
    },
    answer_button_2: {
        ctrl: false,
        shift: false,
        alt: false,
        meta: false,
        key: "2"
    },
    answer_button_3: {
        ctrl: false,
        shift: false,
        alt: false,
        meta: false,
        key: "3"
    },
    continue: {
        ctrl: false,
        shift: false,
        alt: false,
        meta: false,
        key: " "
    },
    play_audio: {
        ctrl: false,
        shift: false,
        alt: false,
        meta: false,
        key: "r"
    },
    quit: {
        ctrl: false,
        shift: false,
        alt: false,
        meta: false,
        key: "q"
    },
}

function start_test() {
    test_started = true;
    document.getElementById("start-info").classList.add("element-hidden");
    document.getElementById("test-area").classList.remove("element-hidden");
    fetch_random_pair();
}

function submit_answer(answer) {
    let is_correct_answer = false;
    if (answer === current_correct_answer_button) {
        is_correct_answer = true;
    }
    update_answer_stats(active_pitch_type, is_correct_answer);
    update_history(current_correct_answer, is_correct_answer);
    show_graded_buttons();
    let pause_after_correct = document.querySelector("#pause-after-correct").checked;
    if (is_correct_answer && !pause_after_correct) {
        setTimeout(fetch_random_pair, 750);
    } else {
        show_continue_button();
    }
}

function show_continue_button() {
    document.getElementById("continue-button").classList.remove("continue-hidden");
}

function hide_continue_button() {
    document.getElementById("continue-button").classList.add("continue-hidden");
}

function update_answer_stats(pitch_type, is_correct_answer) {
    let is_correct_answer_int = is_correct_answer ? 1 : 0;
    if (pitch_type === "heiban") {
        correct_heiban_count += is_correct_answer_int;
        heiban_count += 1;
        let percent = Math.floor(correct_heiban_count / heiban_count * 100);
        let count_text = "" + correct_heiban_count + " of " + heiban_count;
        // Update old format for compatibility
        document.getElementById("heiban-answers").innerHTML = count_text + " (" + percent + "%)";
        // Update new 3-column table
        document.getElementById("heiban-answers-percent").innerHTML = percent + "%";
        document.getElementById("heiban-answers-count").innerHTML = count_text;
        applyPercentColor("heiban-answers-percent", percent);
    } else if (pitch_type === "atamadaka") {
        correct_atamadaka_count += is_correct_answer_int;
        atamadaka_count += 1;
        let percent = Math.floor(correct_atamadaka_count / atamadaka_count * 100);
        let count_text = "" + correct_atamadaka_count + " of " + atamadaka_count;
        // Update old format for compatibility
        document.getElementById("atamadaka-answers").innerHTML = count_text + " (" + percent + "%)";
        // Update new 3-column table
        document.getElementById("atamadaka-answers-percent").innerHTML = percent + "%";
        document.getElementById("atamadaka-answers-count").innerHTML = count_text;
        applyPercentColor("atamadaka-answers-percent", percent);
    } else if (pitch_type === "nakadaka") {
        correct_nakadaka_count += is_correct_answer_int;
        nakadaka_count += 1;
        let percent = Math.floor(correct_nakadaka_count / nakadaka_count * 100);
        let count_text = "" + correct_nakadaka_count + " of " + nakadaka_count;
        // Update old format for compatibility
        document.getElementById("nakadaka-answers").innerHTML = count_text + " (" + percent + "%)";
        // Update new 3-column table
        document.getElementById("nakadaka-answers-percent").innerHTML = percent + "%";
        document.getElementById("nakadaka-answers-count").innerHTML = count_text;
        applyPercentColor("nakadaka-answers-percent", percent);
    }
    let correct_all_count = correct_heiban_count + correct_atamadaka_count + correct_nakadaka_count;
    let all_count = heiban_count + atamadaka_count + nakadaka_count;
    let all_percent = all_count > 0 ? Math.floor(correct_all_count / all_count * 100) : 0;
    let all_count_text = "" + correct_all_count + " of " + all_count;
    // Update old format for compatibility
    document.getElementById("all-answers").innerHTML = all_count_text + " (" + all_percent + "%)<br>";
    // Update new 3-column table
    document.getElementById("all-answers-percent").innerHTML = all_percent + "%";
    document.getElementById("all-answers-count").innerHTML = all_count_text;
    const allPatternName = document.querySelector(".patterns-table tr:first-child");
    applyPercentColor("all-answers-percent", all_percent, [allPatternName]);
}

function update_history(correct_answer, is_correct_answer) {
    let success_failure = "danger"
    if (is_correct_answer) {
        success_failure = "success"
    }
    let new_list_item = '<div class="list-group-item list-group-item-' + success_failure + '">' + correct_answer + "</div>";
    document.getElementById("pairs-history").innerHTML = new_list_item + document.getElementById("pairs-history").innerHTML;
}

function update_answer_buttons(json_data, correct_answer_index) {
    document.getElementById("answer-button-row").innerHTML = "";
    document.getElementById("answer-button-row").classList.remove("element-hidden");
    let graded_answer_button_row = document.getElementById("graded-answer-button-row");
    graded_answer_button_row.innerHTML = '';
    for (const [index, currentValue] of json_data["pairs"].entries()) {
        let raw_pronunciation = currentValue.rawPronunciation;
        let accented_mora = currentValue["accentedMora"];
        let entry = output_accent_plain_text(raw_pronunciation, accented_mora);
        let new_answer_button = document.createElement("div");
        new_answer_button.classList.add("col", "d-grid");
        new_answer_button.innerHTML = '<button type="button" class="btn btn-primary">' + entry + '</button>';
        new_answer_button.addEventListener("click", () => {submit_answer(index)})
        document.getElementById("answer-button-row").appendChild(new_answer_button);

        let sound_data = currentValue["soundData"];
        let button_sound_player = '<audio id="audio_index_' + index + '"src="data:audio/ogg;base64,' + sound_data + '" type="audio/mpeg"></audio>';

        let graded_answer_button_row_wrapper = document.createElement("div");
        graded_answer_button_row_wrapper.classList.add("col", "d-grid");

        if (index === correct_answer_index) {
            graded_answer_button_row_wrapper.innerHTML = button_sound_player + '<button type="button" class="btn btn-success">' + entry + '</button>';
        } else {
            graded_answer_button_row_wrapper.innerHTML = button_sound_player + '<button type="button" class="btn btn-danger">' + entry + '</button>';
        }
        graded_answer_button_row_wrapper.addEventListener("click", () => {document.getElementById("audio_index_" + index).play()})

        graded_answer_button_row.classList.add("element-hidden");
        graded_answer_button_row.appendChild(graded_answer_button_row_wrapper);
    };
}

function update_audio(json_data, pairs_index) {
    let pairs_audio = {};
    for (const [index, currentValue] of json_data["pairs"].entries()) {
        pairs_audio[index] = currentValue["soundData"];
    };
    let sound_data = json_data["pairs"][pairs_index]["soundData"];
    document.getElementById("pair-sound-player").src = "data:audio/ogg;base64," + sound_data;
}

function set_pitch(json_data, pairs_index) {
    let pitch_accent = json_data["pairs"][pairs_index]["pitchAccent"];
    let moracount = json_data["pairs"][pairs_index]["moraCount"];
    if (pitch_accent == 0 || pitch_accent == moracount) {
        active_pitch_type = "heiban";
    } else if (pitch_accent == 1) {
        active_pitch_type = "atamadaka";
    } else {
        active_pitch_type = "nakadaka";
    }
}

function show_graded_buttons() {
    document.getElementById("graded-answer-button-row").classList.remove("element-hidden");
    document.getElementById("answer-button-row").classList.add("element-hidden");
}

function output_accent_plain_text(raw_pronunciation, accented_mora) {
    const small_kana = "ぁぃぅぇぉゃゅょゎァィゥェォヵㇰヶㇱㇲㇳㇴㇵㇶㇷㇷ゚ㇸㇹㇺャュョㇻㇼㇽㇾㇿヮ";
    let output = "";
    let mora = 0;
    let i = 0;
    while (i < raw_pronunciation.length) {
        output += raw_pronunciation.charAt(i);

        i++;
        mora++;

        while (i < raw_pronunciation.length && small_kana.includes(raw_pronunciation.charAt(i))) {
            output += raw_pronunciation.charAt(i);
            i++;
        }

        if (mora === accented_mora) {
            output += "＼";
        }
    }

    return output;
}

function get_json_id() {
    let possible_json_files = [];
    let pitches = ["pitch0", "pitch1", "pitch2", "pitch3", "pitch4"];
    let devoiced = document.getElementById("devoiced").checked;

    if (document.getElementById("strict-pair-finding").checked) {
        let checked_pitches = [];
        let unchecked_pitches = [];
        for (const currentPitch of pitches) {
            if (document.getElementById(currentPitch).checked) {
                checked_pitches.push(currentPitch);
            } else {
                unchecked_pitches.push(currentPitch);
            }
        };

        for (const currentPitch of checked_pitches) {
            for (const currentPair of pairs_index[currentPitch]) {
                let good_pair = true;
                for (const currentUncheckedPitch of unchecked_pitches) {
                    if (pairs_index[currentUncheckedPitch].includes(currentPair)) {
                        good_pair = false;
                    }
                };
                if (devoiced && !pairs_index["devoiced"].includes(currentPair)) {
                    good_pair = false;
                }
                if (good_pair) {
                    possible_json_files.push(currentPair);
                }
            };
        };
    } else {
        for (const currentPitch of pitches) {
            if (document.getElementById(currentPitch).checked) {
                if (devoiced) {
                    for (const currentPair of pairs_index[currentPitch]) {
                        if (pairs_index["devoiced"].includes(currentPair)) {
                            possible_json_files.push(currentPair);
                        }
                    };
                } else {
                    possible_json_files = possible_json_files.concat(pairs_index[currentPitch]);
                }
            }
        };
    }

    if (possible_json_files.length) {
        return possible_json_files[Math.floor(Math.random() * possible_json_files.length)];
    } else {
        return null;
    }
}

function play_pair_audio() {
    const audio_player = document.querySelector("#pair-sound-player");
    audio_player.pause();
    audio_player.currentTime = 0;
    audio_player.play();
}

function quit_application() {
    // Mark this as an intentional quit to allow shutdown
    if (window.markIntentionalQuit) {
        window.markIntentionalQuit();
    }

    if (!hasShutdownEndpoint()) {
        // Quit shortcut is only meaningful when running via the local server
        return;
    }

    fetch('/shutdown', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    }).catch(() => {
        // Ignore errors - server might already be shutting down
    });

    window.close();
}

async function raw_request_audio() {
    let json_file_id = get_json_id();
    if (json_file_id === null) {
        return null;
    }
    return {json_file_id, json_data: await (await fetch("./data/" + json_file_id)).json()};
}

let prefetched_audio_json = raw_request_audio();

async function request_prefetched_audio() {
    let current_audio_json = await prefetched_audio_json;
    if (!current_audio_json) {
        current_audio_json = await raw_request_audio();
    }
    prefetched_audio_json = raw_request_audio();
    return current_audio_json;
}

async function fetch_random_pair() {
    let json_data_raw = await request_prefetched_audio();
    document.documentElement.dataset.badPitchCheckboxes = json_data_raw === null;
    if (json_data_raw === null) {
        return;
    }
    const json_data = json_data_raw.json_data;

    current_correct_answer_button = Math.floor(Math.random() * (json_data["pairs"].length));

    let raw_pronunciation = json_data["pairs"][current_correct_answer_button]["rawPronunciation"];
    let accented_mora = json_data["pairs"][current_correct_answer_button]["accentedMora"];
    current_correct_answer = output_accent_plain_text(raw_pronunciation, accented_mora);

    document.getElementById("kana-text").innerHTML = json_data["kana"];
    update_answer_buttons(json_data, current_correct_answer_button);
    update_audio(json_data, current_correct_answer_button);
    set_pitch(json_data, current_correct_answer_button);
    hide_continue_button();
}

function click_answer_button(index) {
    // graded must be checked first or it will cause a race
    const graded_answer_button_row = document.querySelector("#graded-answer-button-row");
    if (graded_answer_button_row.children.length > index) {
        const graded_answer_button = graded_answer_button_row.children[index];
        if (graded_answer_button.checkVisibility()) { graded_answer_button.click(); }
    }

    const answer_button_row = document.querySelector("#answer-button-row");
    if (answer_button_row.children.length > index) {
        const answer_button = answer_button_row.children[index];
        if (answer_button.checkVisibility()) { answer_button.click(); }
    }
}

// document.querySelector("#start-test-button").addEventListener("click", start_test); // Button removed
document.querySelector("#continue-button-button").addEventListener("click", fetch_random_pair);
for (const element of document.querySelectorAll(".refresh-pair-checkbox")) {
    element.addEventListener("click", () => {
        if (test_started) {
            prefetched_audio_json = null;
            fetch_random_pair();
        }
    });
}

document.addEventListener("keydown", (e) => {
    let shortcut_action = "";
    for (const [key, value] of Object.entries(shortcuts)) {
        if (e.ctrlKey !== value.ctrl ||
            e.shiftKey !== value.shift ||
            e.altKey !== value.alt ||
            e.metaKey !== value.meta ||
            e.key !== value.key) {
                continue;
            }
        shortcut_action = key;
    }
    if (!test_started && shortcut_action !== 'continue') { return; }
    if (shortcut_action.length > 0) { e.preventDefault(); }
    switch (shortcut_action) {
        case "answer_button_1": {
            click_answer_button(0);
            break;
        }
        case "answer_button_2": {
            click_answer_button(1);
            break;
        }
        case "answer_button_3": {
            click_answer_button(2);
            break;
        }
        case "continue": {
            if (!test_started) {
                start_test();
                break;
            }
            const continueWrapper = document.querySelector("#continue-button");
            if (continueWrapper && !continueWrapper.classList.contains("continue-hidden")) {
                fetch_random_pair();
            }
            break;
        }
        case "play_audio": {
            play_pair_audio();
            break;
        }
        case "quit": {
            quit_application();
            break;
        }
        default: {
            return;
        }
    }
});

// Initialize shortcuts from HTML input values
function initializeShortcuts() {
    for (const element of document.querySelectorAll(".shortcut-input")) {
        const inputValue = element.value;
        const shortcutId = element.id;

        // Parse the input value to get the key
        let key = inputValue;
        if (inputValue === "Space") {
            key = " ";
        } else if (inputValue === "←") {
            key = "ArrowLeft";
        } else if (inputValue === "→") {
            key = "ArrowRight";
        } else if (inputValue === "↑") {
            key = "ArrowUp";
        } else if (inputValue === "↓") {
            key = "ArrowDown";
        }

        shortcuts[shortcutId] = {
            ctrl: false,
            shift: false,
            alt: false,
            meta: false,
            key: key,
        };

        // Add arrow-key class for styling if value contains arrows
        if (inputValue === "←" || inputValue === "→" || inputValue === "↑" || inputValue === "↓") {
            element.classList.add('arrow-key');
        }
    }
}

// Initialize shortcuts on page load
initializeShortcuts();
initializePercentColors();

// Add click handlers for options-group to toggle checkboxes
for (const optionsGroup of document.querySelectorAll('.options-group')) {
    optionsGroup.addEventListener('click', (e) => {
        // Find the checkbox within this options-group
        const checkbox = optionsGroup.querySelector('input[type="checkbox"]');
        if (checkbox && e.target !== checkbox) {
            // Only toggle if we didn't click directly on the checkbox
            e.preventDefault();
            checkbox.checked = !checkbox.checked;
            // Trigger the checkbox's change event to maintain existing functionality
            checkbox.dispatchEvent(new Event('click'));
        }
    });
}

// Auto-start test on page load
window.addEventListener('load', () => {
    start_test();
});

for (const element of document.querySelectorAll(".shortcut-input")) {
    element.addEventListener("keydown", (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();

        shortcuts[e.target.id] = {
            ctrl: e.ctrlKey,
            shift: e.shiftKey,
            alt: e.altKey,
            meta: e.metaKey,
            key: e.key,
        }

        let modifiers_string = (e.ctrlKey ? "^" : "") + (e.shiftKey ? "+" : "") + (e.altKey ? "!" : "") + (e.metaKey ? "#" : "");
        let key_string;
        if (e.key === " ") {
            key_string = "Space";
        } else if (e.key === "ArrowLeft") {
            key_string = "←";
        } else if (e.key === "ArrowRight") {
            key_string = "→";
        } else if (e.key === "ArrowUp") {
            key_string = "↑";
        } else if (e.key === "ArrowDown") {
            key_string = "↓";
        } else {
            key_string = e.key;
        }
        e.target.value = modifiers_string + key_string;

        // Add or remove arrow-key class for styling
        if (key_string === "←" || key_string === "→" || key_string === "↑" || key_string === "↓") {
            e.target.classList.add('arrow-key');
        } else {
            e.target.classList.remove('arrow-key');
        }
    });
}
