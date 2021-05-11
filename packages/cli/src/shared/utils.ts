/**
 * Converts a string into a dashed string by adding a dash before capitalized letters. No dashes are added before
 * capital letters if the capital letters are at the start of the string
 * @example
 * dasherize('MyString') === 'my-string';
 * dasherize('OBBCConnection') === 'odbcconnection';
 * @param text text that will be converted into a dashed string
 */
export function dasherize(text: string) {


    let capitalCaseIndex: number;
    const appliedIndices: number[] = [];

    while (capitalCaseIndex !== -1) {
        capitalCaseIndex = text.search(/([A-Z]{1}).*/g);
        if (capitalCaseIndex !== -1) {

            let seperator = '';
            if (capitalCaseIndex > 0) {
                if (appliedIndices.indexOf(capitalCaseIndex - 1) === -1) {
                    seperator = '-';
                }
            }

            text = text.substring(0, capitalCaseIndex) +
                seperator +
                text.substring(capitalCaseIndex, capitalCaseIndex + 1).toLowerCase() +
                text.substring(capitalCaseIndex + 1, text.length);

            appliedIndices.push(capitalCaseIndex);
        }
    }
    while (text.indexOf(' ') !== -1) {
        text = text.replace(' ', '-');
    }
    while (text.indexOf('--') !== -1) {
        text = text.replace('--', '-');
    }
    if (text.charAt(0) === '-') {
        text = text.replace('-', '');
    }
    return text;
}

/**
 * Converts a string into a dashed string by adding a dash before capitalized letters. No dashes are added before
 * capital letters if the capital letters are at the start of the string
 * @example
 * dasherize('MyString') === 'my-string';
 * dasherize('OBBCConnection') === 'odbcconnection';
 * @param text text that will be converted into a dashed string
 */
export function capitalize(text: string) {
    let dasherized = dasherize(text);
    if (dasherized.length > 0) {
        dasherized = dasherized.charAt(0).toUpperCase() + dasherized.substring(1, dasherized.length)
    }

    let index = dasherized.indexOf('-');
    while (index !== -1) {
        dasherized = dasherized.substring(0, index) + (dasherized.charAt(index + 1) || '').toUpperCase() + dasherized.substring(index + 2, dasherized.length)
        index = dasherized.indexOf('-');
    }
    return dasherized;
}

export const asynForEach = async <T>(list: T[], fn: (item: T, index: number, all: T[]) => Promise<any>) => {
    for (let i = 0; i < list.length; i++) {
        await fn(list[i], i, list);
    }
}
