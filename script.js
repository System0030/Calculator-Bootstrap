$(document).ready(function() {
    let display = $('#display');
    let lastWasEqual = false;
    let historyList = $('#history-list');
    let lastInput = ''; // Track the last input

    const isOperator = char => ['+', '-', '*', '/'].includes(char);

    const handleImplicitMultiplication = (expression) => {
        let modifiedExpression = expression.replace(/(\d+)\(/g, '$1*(');
        return modifiedExpression;
    };

    // Function to escape HTML special characters
    function escapeHtml(text) {
        let map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    function clearInput() {
        if (display.val() === '' && lastInput === '') {
            historyList.empty(); // Clear history if clear is clicked twice without input
        } else {
            display.val('');
        }
        lastInput = '';
    }

    $('button').on('click', function() {
        let value = $(this).text();

        if (value === 'Clear') {
            clearInput();
        } else if (value === '⌫') {
            if (lastWasEqual) {
                display.val('');
                lastWasEqual = false;
            } else {
                display.val(display.val().slice(0, -1));
            }
        } else if (value === '=') {
            try {
                let expression = display.val();
                expression = handleImplicitMultiplication(expression);
                let result = eval(expression.replace(/%/g, '/100'));
                display.val(result);
                lastWasEqual = true;

                // Escape HTML before adding to history
                let escapedExpression = escapeHtml(expression);
                let escapedResult = escapeHtml(result);

                historyList.prepend(`<p>${escapedExpression} = ${escapedResult}</p>`);
                lastInput = display.val(); // Update last input
            } catch (e) {
                display.val('syntax');
                lastWasEqual = true;
                lastInput = 'syntax'; // Update last input
            }
        } else if (value === '+/-') {
            let current = display.val();
            if (current) {
                if (current.startsWith('-')) {
                    display.val(current.slice(1));
                } else {
                    display.val('-' + current);
                }
            }
        } else if (value === '.') {
            let current = display.val();
            let parts = current.split(/[\+\-\*\/\(\)]/);
            let lastPart = parts[parts.length - 1];
            if (!lastPart.includes('.')) {
                display.val(current + value);
            }
        } else if (value === '%') {
            let current = display.val();
            if (current) {
                let parts = current.split(/[\+\-\*\/\(]/);
                let lastPart = parts[parts.length - 1];
                if (lastPart) {
                    try {
                        let percentage = eval(lastPart) / 100;
                        let startOfLastPart = current.lastIndexOf(lastPart);
                        let newCurrent = current.substring(0, startOfLastPart) + percentage;
                        display.val(newCurrent);
                    } catch (e) {
                        display.val('syntax');
                    }
                } else {
                    return;
                }
            }
        } else {
            if (lastWasEqual && /[0-9.+\-*/()%]/.test(value)) {
                display.val('');
                lastWasEqual = false;
            }

            let current = display.val();
            let lastChar = current.slice(-1);

            if (current === '' && /[+*/)]/.test(value)) return;

            if (isOperator(value)) {
                if (isOperator(lastChar)) {
                    display.val(current.slice(0, -1) + value);
                    return;
                }
            }

            if (value === ')' && (current.match(/\(/g) || []).length <= (current.match(/\)/g) || []).length) {
                return;
            }

            // Prevent leading zeros except for "0."
            if (current === '0' && value !== '.' && !isOperator(value)) {
                display.val(value);
            } else if (current !== '0' || value!== '0' || current.includes('.')) {
                display.val(current + value);
            }

            lastInput = display.val(); // Update last input
        }
    });

    display.prop('readonly', false);

    display.on('input', function(e) {
        let allowed = /[0-9+\-*/().]/g;
        let newValue = $(this).val().match(allowed) || [];

        if (/^[+*/)]/.test(newValue.join(''))) {
            newValue.shift();
        }

        let fixedValue = [];
        for (let i = 0; i < newValue.length; i++) {
            let curr = newValue[i];
            let prev = fixedValue[fixedValue.length - 1];

            if (i === 0 && curr === '-') {
                fixedValue.push(curr);
                continue;
            }

            if (isOperator(curr) && isOperator(prev)) {
                continue;
            }
            fixedValue.push(curr);
        }

        // Prevent leading zeros except for "0."
        if (fixedValue.length > 1 && fixedValue[0] === '0' && fixedValue[1] !== '.') {
            fixedValue.shift();
        }

        $(this).val(fixedValue.join(''));
    });

    display.on('keydown', function(e) {
        let operators = ['+', '-', '*', '/'];
        let current = display.val();
        let lastChar = current.slice(-1);

        if (operators.includes(e.key)) {
            if (current === '' && e.key !== '-') {
                e.preventDefault();
                return;
            }

            if (isOperator(lastChar)) {
                e.preventDefault();
                display.val(current.slice(0, -1) + e.key);
                return;
            }

            e.preventDefault();
            display.val(current + e.key);
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            $('button:contains("=")').click();
        }
    });
});