import { test, expect, chromium } from '@playwright/test';

test('Intalk - Create 24 Automation Users', async ({ page }) => {

    // ==================================================
    // TEST TIMEOUT - 20 MINUTES
    // ==================================================
    test.setTimeout(20 * 60 * 1000);

    // ==================================================
    // HOLD - 600ms BETWEEN ACTIONS
    // ==================================================
    const hold = async () => {
        await page.waitForTimeout(600);
    };

    // ==================================================
    // 1. GRANT MICROPHONE PERMISSION
    // ==================================================
    await page.context().grantPermissions(
        ['microphone'],
        { origin: 'https://qaui.intalk.cc' }
    );
    await hold();

    const acceptMicrophonePrompt = async () => {
        const allowButton = page.getByRole('button', {
            name: /allow while visiting the site|allow this time|allow access|yes/i
        });

        try {
            await allowButton.waitFor({
                state: 'visible',
                timeout: 5000
            });
            await allowButton.click();
            await hold();
            console.log('Microphone permission accepted via prompt.');
        } catch {
            console.log('No microphone prompt detected; permission already granted.');
        }
    };

    // ==================================================
    // 2. OPEN INTALK
    // ==================================================
    await page.goto(
        'https://qaui.intalk.cc/intalk/dashboard/home',
        { waitUntil: 'domcontentloaded' }
    );
    await hold();

    await acceptMicrophonePrompt();

    // ==================================================
    // 3. LOGIN WITH FALLBACK FOR ALREADY-LOGGED-IN SESSION
    // ==================================================
    const clearUserTokenFallback = async () => {
        const adminPage = await page.context().newPage();
        let adminerPage = adminPage;

        try {
            console.log('Opening a new admin tab in the same browser to clear stale bat_super session...');
            const mgmtHold = async () => {
                if (adminPage.isClosed()) {
                    throw new Error('Admin management page was closed unexpectedly.');
                }
                await adminPage.waitForTimeout(600);
            };

            await adminPage.addInitScript(() => {
                localStorage.clear();
                sessionStorage.clear();
            });

            await adminPage.goto('https://qaui.intalk.cc/mgmt.php?logout=1', {
                waitUntil: 'domcontentloaded'
            });
            await mgmtHold();

            const clickSafely = async (locator: any) => {
                try {
                    await locator.click({ force: true, timeout: 5000 });
                } catch {
                    await locator.evaluate((el: HTMLElement) => {
                        el.dispatchEvent(new MouseEvent('click', {
                            bubbles: true,
                            cancelable: true,
                            view: window
                        }));
                    });
                }
            };

            const adminUsername = adminPage.locator('input[name="username"], input#username').first();
            const adminPassword = adminPage.locator('input[name="password"]').first();

            await adminUsername.waitFor({
                state: 'visible',
                timeout: 15000
            }).catch(async () => {
                console.log('Admin username field did not appear on mgmt.php');
                console.log('mgmt url:', adminPage.url());
                console.log('mgmt title:', await adminPage.title().catch(() => 'unknown'));
                console.log('mgmt body snippet:', (await adminPage.locator('body').innerText().catch(() => '')).slice(0, 500));
                throw new Error('Admin login form is not visible on mgmt.php');
            });

            await adminUsername.fill('admin');
            await adminUsername.evaluate((el) => {
                (el as HTMLInputElement).value = 'admin';
            });
            await mgmtHold();

            await adminPassword.waitFor({
                state: 'visible',
                timeout: 15000
            }).catch(async () => {
                console.log('Admin password field did not appear on mgmt.php');
                console.log('mgmt url:', adminPage.url());
                console.log('mgmt title:', await adminPage.title().catch(() => 'unknown'));
                console.log('mgmt body snippet:', (await adminPage.locator('body').innerText().catch(() => '')).slice(0, 500));
                throw new Error('Admin password field is not visible on mgmt.php');
            });

            await adminPassword.fill('Agami@12');
            await adminPassword.evaluate((el) => {
                (el as HTMLInputElement).value = 'Agami@12';
            });
            await mgmtHold();

            const adminLoginButton = adminPage.locator('button#btn_login, button[type="submit"]').filter({
                hasText: /sign in|login|log in/i
            }).first();

            await adminLoginButton.waitFor({
                state: 'visible',
                timeout: 15000
            }).catch(async () => {
                console.log('Sign In button did not appear on mgmt.php');
                console.log('mgmt url:', adminPage.url());
                console.log('mgmt title:', await adminPage.title().catch(() => 'unknown'));
                console.log('mgmt body snippet:', (await adminPage.locator('body').innerText().catch(() => '')).slice(0, 500));
                throw new Error('Admin Sign In button is not visible on mgmt.php');
            });

            await clickSafely(adminLoginButton);
            await mgmtHold();

            const advanceLink = adminPage.locator('a,button,span').filter({
                hasText: /^Advanced$/i
            }).first();
            await advanceLink.waitFor({
                state: 'visible',
                timeout: 20000
            }).catch(async () => {
                console.log('Advanced menu did not appear after admin login');
                console.log('mgmt url:', adminPage.url());
                console.log('mgmt title:', await adminPage.title().catch(() => 'unknown'));
                console.log('mgmt body snippet:', (await adminPage.locator('body').innerText().catch(() => '')).slice(0, 500));
                throw new Error('Advanced menu did not appear after admin login');
            });

            await clickSafely(advanceLink);
            await mgmtHold();

            const adminerLink = adminPage.locator('a,button,span').filter({
                hasText: /^Adminer$/i
            }).first();
            await adminerLink.waitFor({
                state: 'visible',
                timeout: 20000
            }).catch(async () => {
                console.log('Adminer link did not appear after Advanced click');
                console.log('mgmt url:', adminPage.url());
                console.log('mgmt title:', await adminPage.title().catch(() => 'unknown'));
                console.log('mgmt body snippet:', (await adminPage.locator('body').innerText().catch(() => '')).slice(0, 500));
                throw new Error('Adminer link did not appear after Advanced click');
            });

            // ==================================================
            // OPEN ADMINER
            // Adminer may open in a NEW TAB / PAGE.
            // ==================================================
            console.log('Opening Adminer...');

            const newAdminerPagePromise = adminPage
                .context()
                .waitForEvent('page', { timeout: 10000 })
                .catch(() => null);

            await clickSafely(adminerLink);

            const newAdminerPage = await newAdminerPagePromise;

            if (newAdminerPage) {
                adminerPage = newAdminerPage;
                console.log('SUCCESS: Adminer opened in a new page.');
            } else {
                console.log('Adminer did not open a new page. Using current page.');
            }

            await adminerPage.waitForLoadState('domcontentloaded').catch(() => {});
            await adminerPage.waitForTimeout(600);

            console.log(`Adminer URL: ${adminerPage.url()}`);

            // ==================================================
            // WAIT FOR ADMINER LOGIN FORM
            // ==================================================
            await adminerPage.locator('body').waitFor({
                state: 'visible',
                timeout: 15000
            });

            // --------------------------------------------------
            // SYSTEM = MYSQL
            // --------------------------------------------------
            const systemSelect = adminerPage.locator('select').first();

            await systemSelect.waitFor({
                state: 'visible',
                timeout: 15000
            });

            const currentSystem = await systemSelect.inputValue().catch(() => '');

            if (!/mysql/i.test(currentSystem)) {
                await systemSelect.selectOption({ label: 'MySQL' }).catch(async () => {
                    await systemSelect.selectOption({ value: 'mysql' });
                });
                await adminerPage.waitForTimeout(600);
            }

            console.log('Adminer System: MySQL');

            // --------------------------------------------------
            // SERVER
            // --------------------------------------------------
            const adminerServer = adminerPage
                .locator('input[name="auth[server]"]')
                .first();

            await adminerServer.waitFor({
                state: 'visible',
                timeout: 15000
            });

            const currentServer = (await adminerServer.inputValue()).trim();

            console.log(`Adminer Server before: ${currentServer}`);

            if (currentServer !== '192.168.2.88') {
                await adminerServer.fill('192.168.2.88');
                await adminerPage.waitForTimeout(600);
            }

            // --------------------------------------------------
            // USERNAME
            // --------------------------------------------------
            const adminerUsername = adminerPage
                .locator('input[name="auth[username]"]')
                .first();

            await adminerUsername.waitFor({
                state: 'visible',
                timeout: 15000
            });

            await adminerUsername.fill('opencc');
            await adminerUsername.press('Tab');
            await adminerPage.waitForTimeout(600);

            console.log(`Adminer Username: ${await adminerUsername.inputValue()}`);

            // --------------------------------------------------
            // PASSWORD
            // --------------------------------------------------
            const adminerPassword = adminerPage
                .locator('input[name="auth[password]"]')
                .first();

            await adminerPassword.waitFor({
                state: 'visible',
                timeout: 15000
            });

            await adminerPassword.fill('opencc');
            await adminerPassword.press('Tab');
            await adminerPage.waitForTimeout(600);

            console.log('Adminer Password: ********');

            // --------------------------------------------------
            // DATABASE
            // --------------------------------------------------
            const adminerDatabase = adminerPage
                .locator('input[name="auth[db]"]')
                .first();

            await adminerDatabase.waitFor({
                state: 'visible',
                timeout: 15000
            });

            await adminerDatabase.fill('opencc');
            await adminerDatabase.press('Tab');
            await adminerPage.waitForTimeout(600);

            console.log(`Adminer Database: ${await adminerDatabase.inputValue()}`);

            // ==================================================
            // VERIFY ADMINER VALUES BEFORE LOGIN
            // ==================================================
            const verifyServer = (await adminerServer.inputValue()).trim();
            const verifyUsername = (await adminerUsername.inputValue()).trim();
            const verifyPassword = await adminerPassword.inputValue();
            const verifyDatabase = (await adminerDatabase.inputValue()).trim();

            if (verifyServer !== '192.168.2.88') {
                throw new Error(`Adminer Server incorrect: ${verifyServer}`);
            }

            if (verifyUsername !== 'opencc') {
                throw new Error(`Adminer Username incorrect: ${verifyUsername}`);
            }

            if (!verifyPassword) {
                throw new Error('Adminer Password is empty.');
            }

            if (verifyDatabase !== 'opencc') {
                throw new Error(`Adminer Database incorrect: ${verifyDatabase}`);
            }

            console.log('Adminer credentials verified successfully.');

            // ==================================================
            // ADMINER LOGIN
            // ==================================================
            const adminerLogin = adminerPage
                .locator('input[type="submit"][value="Login"], button[type="submit"]')
                .first();

            await adminerLogin.waitFor({
                state: 'visible',
                timeout: 15000
            });

            await adminerPage.waitForTimeout(600);

            console.log('Clicking Adminer Login...');

            await adminerLogin.click();

            await adminerPage.waitForLoadState('domcontentloaded').catch(() => {});
            await adminerPage.waitForTimeout(600);

            console.log(`Adminer URL after login: ${adminerPage.url()}`);

            // ==================================================
            // VERIFY ADMINER LOGIN
            // ==================================================
            const usernameStillVisible = await adminerPage
                .locator('input[name="auth[username]"]')
                .first()
                .isVisible()
                .catch(() => false);

            if (usernameStillVisible) {
                console.log('Adminer login form is still visible.');
                console.log(
                    'Adminer body:',
                    (await adminerPage.locator('body').innerText().catch(() => '')).slice(0, 2000)
                );
                throw new Error('Adminer login failed. Login form is still visible.');
            }

            console.log('SUCCESS: Adminer login completed.');

            // ==================================================
            // OPEN v_users TABLE
            // ==================================================
            const vUserTable = adminerPage
                .getByText('v_users', { exact: true })
                .first();

            await vUserTable.waitFor({
                state: 'visible',
                timeout: 15000
            });

            await vUserTable.click();
            await mgmtHold();

            console.log('v_users table opened.');

            // ==================================================
            // CLICK SELECT DATA
            // ==================================================
            const selectData = adminerPage
                .getByText(/select data/i)
                .first();

            await selectData.waitFor({
                state: 'visible',
                timeout: 15000
            });

            await selectData.click();
            await mgmtHold();

            console.log('Select data clicked.');

            // ==================================================
            // CLICK SEARCH IF DISPLAYED
            // ==================================================
            const searchControl = adminerPage
                .locator('input[type="submit"][value="Search"], input[type="button"][value="Search"], button, a')
                .filter({ hasText: /^search$/i })
                .first();

            const directSearchControl = adminerPage
                .locator('input[type="submit"][value="Search"], input[type="button"][value="Search"]')
                .first();

            if (await searchControl.count() > 0 &&
                await searchControl.isVisible().catch(() => false)) {
                await searchControl.click();
                await mgmtHold();
                console.log('Search button clicked.');
            } else if (await directSearchControl.count() > 0 &&
                       await directSearchControl.isVisible().catch(() => false)) {
                await directSearchControl.click();
                await mgmtHold();
                console.log('Search button clicked.');
            } else {
                console.log('Search button not separately displayed; continuing with Select Data filters.');
            }

            // ==================================================
            // SELECT COLUMN = USERNAME
            // ==================================================
            const columnDropdown = adminerPage
                .locator('select[name="where[0][col]"]')
                .first();

            await columnDropdown.waitFor({
                state: 'visible',
                timeout: 15000
            });

            const columnOptions = await columnDropdown.locator('option').allTextContents();
            const usernameOption = columnOptions.find(
                option => option.trim().toLowerCase() === 'username'
            );

            if (!usernameOption) {
                throw new Error(
                    `Username option not found in Adminer column dropdown. Available: ${columnOptions.join(', ')}`
                );
            }

            await columnDropdown.selectOption({ label: usernameOption.trim() });
            await mgmtHold();

            console.log('Column selected: username.');

            // ==================================================
            // SELECT OPERATOR = LIKE %%
            // ==================================================
            const operatorDropdown = adminerPage
                .locator('select[name="where[0][op]"]')
                .first();

            await operatorDropdown.waitFor({
                state: 'visible',
                timeout: 15000
            });

            const operatorOptions = await operatorDropdown.locator('option').allTextContents();
            const likeOption = operatorOptions.find(
                option => /like/i.test(option) && /%/.test(option)
            ) || operatorOptions.find(
                option => /^\s*like\s*$/i.test(option)
            );

            if (!likeOption) {
                throw new Error(
                    `LIKE operator was not found in Adminer. Available: ${operatorOptions.join(', ')}`
                );
            }

            await operatorDropdown.selectOption({ label: likeOption.trim() });
            await mgmtHold();

            console.log(`Operator selected: ${likeOption.trim()}`);

            // ==================================================
            // ENTER VALUE = bat_super
            // ==================================================
            const usernameSearchValue = adminerPage
                .locator('input[name="where[0][val]"]')
                .first();

            await usernameSearchValue.waitFor({
                state: 'visible',
                timeout: 15000
            });

            await usernameSearchValue.fill('bat_super');
            await mgmtHold();

            console.log('Search value entered: bat_super.');

            // ==================================================
            // CLICK SELECT BUTTON
            // ==================================================
            const selectButton = adminerPage
                .locator(
                    'input[type="submit"][value="Select"], button'
                )
                .filter({ hasText: /^select$/i })
                .first();

            let selectControl = selectButton;

            if (await selectControl.count() === 0) {
                selectControl = adminerPage
                    .locator('input[type="submit"][value="Select"]')
                    .first();
            }

            await selectControl.waitFor({
                state: 'visible',
                timeout: 15000
            });

            await selectControl.click();
            await adminerPage.waitForLoadState('domcontentloaded').catch(() => {});
            await mgmtHold();

            console.log('Select button clicked. Search results displayed.');

            // ==================================================
            // FIND bat_super RESULT
            // Use the actual username cell, then move to its row.
            // This is more reliable than searching the entire <tr>.
            // ==================================================
            console.log('Looking for bat_super result...');

            const batSuperCell = adminerPage
                .getByText('bat_super', { exact: true })
                .first();

            await batSuperCell.waitFor({
                state: 'visible',
                timeout: 15000
            });

            console.log('bat_super username cell found.');

            const batSuperRow = batSuperCell.locator(
                'xpath=ancestor::tr[1]'
            );

            await batSuperRow.waitFor({
                state: 'visible',
                timeout: 15000
            });

            console.log('bat_super result row found.');

            // ==================================================
            // FIND user_token COLUMN FROM TABLE HEADER
            // ==================================================
            console.log('Looking for user_token column...');

            const resultTable = batSuperRow.locator('xpath=ancestor::table[1]');
            const headerRow = resultTable.locator('tr').filter({
                hasText: /user_token/i
            }).first();

            await headerRow.waitFor({
                state: 'visible',
                timeout: 15000
            });

            const headerCells = headerRow.locator('th, td');
            const headerCount = await headerCells.count();
            let userTokenColumnIndex = -1;

            for (let index = 0; index < headerCount; index++) {
                const headerText = (await headerCells.nth(index).innerText().catch(() => '')).trim();

                if (/^user_token$/i.test(headerText)) {
                    userTokenColumnIndex = index;
                    break;
                }
            }

            if (userTokenColumnIndex === -1) {
                throw new Error(
                    `user_token column was not found. Headers: ${await headerCells.allTextContents()}`
                );
            }

            console.log(
                `user_token column found at index ${userTokenColumnIndex}.`
            );

            // ==================================================
            // READ CURRENT user_token VALUE
            // ==================================================
            const resultCells = batSuperRow.locator('td, th');

            const userTokenCell = resultCells.nth(
                userTokenColumnIndex
            );

            console.log(
                'Current user_token value:',
                (await userTokenCell.innerText().catch(() => '')).trim()
            );

            // ==================================================
            // CLICK EDIT
            // ==================================================
            console.log('Looking for Edit action...');

            let editControl = batSuperRow
                .locator('a[href*="edit"], button')
                .first();

            if (await editControl.count() === 0) {
                editControl = batSuperRow
                    .locator('a')
                    .filter({
                        hasText: /edit/i
                    })
                    .first();
            }

            if (await editControl.count() === 0) {
                editControl = batSuperRow
                    .locator('[title*="edit" i], [aria-label*="edit" i]')
                    .first();
            }

            if (await editControl.count() === 0) {
                console.log('Could not find Edit control in bat_super row.');
                console.log('bat_super row text:', await batSuperRow.innerText());
                throw new Error('Edit action for bat_super was not found.');
            }

            await editControl.waitFor({
                state: 'visible',
                timeout: 15000
            });

            await editControl.click();

            await adminerPage.waitForLoadState(
                'domcontentloaded'
            ).catch(() => {});

            await mgmtHold();

            console.log('Edit page opened for bat_super.');

            // ==================================================
            // FIND user_token EDIT FIELD
            // ==================================================
            console.log('Looking for user_token edit field...');

            let userTokenEditField = adminerPage
                .locator(
                    'input[name="fields[user_token]"], textarea[name="fields[user_token]"]'
                )
                .first();

            if (await userTokenEditField.count() === 0) {
                userTokenEditField = adminerPage
                    .locator(
                        'input[name*="user_token" i], textarea[name*="user_token" i]'
                    )
                    .first();
            }

            if (await userTokenEditField.count() === 0) {
                // Fallback: locate the label/text and its nearby input.
                const tokenLabel = adminerPage
                    .getByText('user_token', { exact: true })
                    .first();

                if (await tokenLabel.count() > 0) {
                    userTokenEditField = tokenLabel
                        .locator(
                            'xpath=following::input[1] | following::textarea[1]'
                        )
                        .first();
                }
            }

            await userTokenEditField.waitFor({
                state: 'visible',
                timeout: 15000
            });

            const oldTokenValue = await userTokenEditField
                .inputValue()
                .catch(() => '');

            console.log(
                `user_token field found. Current value length: ${oldTokenValue.length}`
            );

            // ==================================================
            // REMOVE user_token VALUE
            // ==================================================
            await userTokenEditField.fill('');
            await mgmtHold();

            const tokenAfterClear = await userTokenEditField
                .inputValue()
                .catch(() => '');

            if (tokenAfterClear !== '') {
                throw new Error(
                    'user_token value could not be cleared.'
                );
            }

            console.log('user_token value cleared successfully.');

            // ==================================================
            // SAVE EDITED RECORD
            // ==================================================
            console.log('Looking for Save button...');

            let editSaveButton = adminerPage
                .locator(
                    'input[type="submit"][value="Save"], input[type="submit"][value="Update"]'
                )
                .first();

            if (await editSaveButton.count() === 0) {
                editSaveButton = adminerPage
                    .getByRole('button', {
                        name: /save|update/i
                    })
                    .first();
            }

            await editSaveButton.waitFor({
                state: 'visible',
                timeout: 15000
            });

            await editSaveButton.click();

            await adminerPage.waitForLoadState(
                'domcontentloaded'
            ).catch(() => {});

            await mgmtHold();

            console.log(
                'SUCCESS: bat_super user_token cleared and saved.'
            );

            console.log('Fallback session cleanup completed for bat_super.');
        } finally {
            if (typeof adminerPage !== 'undefined' && adminerPage !== adminPage && !adminerPage.isClosed()) {
                await adminerPage.close().catch(() => {});
            }

            if (!adminPage.isClosed()) {
                await adminPage.close().catch(() => {});
            }
        }
    };

    const loginWithBatSuper = async () => {
        await page.getByLabel('User ID').fill('bat_super');
        await hold();

        await page
            .locator('input[type="password"]')
            .first()
            .fill('Pass@12');
        await hold();

        await page.getByRole('button', {
            name: /login/i
        }).click();
        await hold();

        const alreadyLoggedInBanner = page.getByText(/already.*logged|already.*login|user is already/i).first();
        if (await alreadyLoggedInBanner.count() > 0 && await alreadyLoggedInBanner.isVisible().catch(() => false)) {
            console.log('User already logged in detected. Running admin fallback...');
            await clearUserTokenFallback();
            await loginWithBatSuper();
            return;
        }

        const forceLoginOption = page
            .getByText('Force Login', { exact: true })
            .first();

        if (
            await forceLoginOption.count() > 0 &&
            await forceLoginOption.isVisible().catch(() => false)
        ) {
            console.log('Force Login option detected. Clicking Force Login...');
            await hold();
            await forceLoginOption.click();
            await hold();
            console.log('Force Login clicked successfully.');
        } else {
            console.log('Force Login option not displayed. Continuing normally.');
        }
    };

    await loginWithBatSuper();

    // ==================================================
    // 4. MOVE MOUSE TO LEFT PANEL
    // ==================================================
    await page.mouse.move(10, 300);
    await hold();

    // ==================================================
    // 5. CLICK SETTINGS
    // ==================================================
    const settingsMenu = page
        .getByText('Settings', { exact: true })
        .first();

    await expect(settingsMenu).toBeVisible({
        timeout: 10000
    });

    await hold();

    await settingsMenu.click();
    await hold();

    // ==================================================
    // 6. CLICK USERS
    // ==================================================
    const usersMenu = page
        .getByText('Users', { exact: true })
        .first();

    await expect(usersMenu).toBeVisible({
        timeout: 10000
    });

    await hold();

    await usersMenu.click();
    await hold();

    // ==================================================
    // HELPER: SEARCH AUTOMATION USERS
    // ==================================================
    const searchAutomationUsers = async () => {

        console.log(
            'Searching RC_User_Automaton users...'
        );

        const filterButton = page.getByRole('button', {
            name: /filter/i
        });

        await expect(filterButton).toBeVisible({
            timeout: 10000
        });

        await hold();

        await filterButton.click();
        await hold();

        await expect(
            page.getByText('Filters', {
                exact: true
            })
        ).toBeVisible({
            timeout: 10000
        });

        await hold();

        const usernameFilter = page
            .getByLabel('Username')
            .last();

        await usernameFilter.fill(
            'RC_User_Automaton'
        );

        await hold();

        const applyButton = page.getByRole('button', {
            name: /^apply$/i
        });

        await expect(applyButton).toBeVisible({
            timeout: 10000
        });

        await hold();

        await applyButton.click();
        await hold();

        console.log(
            'RC_User_Automaton filter applied.'
        );
    };

    // ==================================================
    // HELPER: DELETE ALL FILTERED AUTOMATION USERS
    // ==================================================
    const deleteAllFilteredUsers = async () => {

        console.log(
            'Checking for existing RC_User_Automaton users...'
        );

        await hold();

        const automationRows = page
            .getByRole('row')
            .filter({
                hasText: 'RC_User_Automaton'
            });

        const rowCount =
            await automationRows.count();

        console.log(
            `Automation rows found: ${rowCount}`
        );

        // --------------------------------------------------
        // NO USERS -> SKIP DELETE
        // --------------------------------------------------
        if (rowCount === 0) {

            console.log(
                'No RC_User_Automaton users found.'
            );

            console.log(
                'Skipping deletion and continuing...'
            );

            await hold();

            return;
        }

        console.log(
            `Found ${rowCount} RC_User_Automaton row(s).`
        );

        await hold();

        // ==================================================
        // FIND TABLE HEADER CONTAINING USERNAME
        // ==================================================
        console.log(
            'Locating Users table header...'
        );

        const headerRow = page
            .getByRole('row')
            .filter({
                hasText: 'Username'
            })
            .first();

        await expect(headerRow).toBeVisible({
            timeout: 10000
        });

        await hold();

        console.log(
            'Users table header located.'
        );

        // ==================================================
        // FIND SELECT ALL CHECKBOX
        // Checkbox before Username column
        // ==================================================
        const selectAllCheckbox =
            headerRow.locator(
                'input[type="checkbox"]'
            ).first();

        await expect(
            selectAllCheckbox
        ).toBeVisible({
            timeout: 10000
        });

        await hold();

        console.log(
            'Select All checkbox located.'
        );

        // ==================================================
        // SELECT ALL FILTERED USERS
        // ==================================================
        if (!(await selectAllCheckbox.isChecked())) {

            console.log(
                'Select All is currently unchecked.'
            );

            await selectAllCheckbox.check();

            await hold();

            console.log(
                'Select All checkbox selected.'
            );

        } else {

            console.log(
                'Select All checkbox is already selected.'
            );

            await hold();
        }

        // ==================================================
        // VERIFY SELECT ALL
        // ==================================================
        const isSelectAllChecked =
            await selectAllCheckbox.isChecked();

        console.log(
            `Select All checked status: ${isSelectAllChecked}`
        );

        if (!isSelectAllChecked) {

            throw new Error(
                'Select All checkbox could not be selected.'
            );
        }

        await hold();

        // ==================================================
        // DELETE BUTTON
        // ==================================================
        const deleteButton = page
            .getByRole('button', {
                name: /delete/i
            })
            .first();

        if (await deleteButton.count() === 0) {

            console.log(
                'Delete button not found.'
            );

            await hold();

            return;
        }

        await expect(deleteButton).toBeVisible({
            timeout: 10000
        });

        await hold();

        console.log(
            'Delete button found. Clicking delete...'
        );

        await deleteButton.click();
        await hold();

        // ==================================================
        // CONFIRM DELETE
        // ==================================================
        const confirmDeleteButton =
            page.getByRole('button', {
                name: /delete|yes|confirm/i
            }).last();

        if (
            await confirmDeleteButton.count() > 0
        ) {

            await expect(
                confirmDeleteButton
            ).toBeVisible({
                timeout: 10000
            });

            await hold();

            console.log(
                'Delete confirmation found.'
            );

            await confirmDeleteButton.click();

            await hold();

            console.log(
                'Delete confirmation clicked.'
            );

        } else {

            console.log(
                'No delete confirmation button found.'
            );
        }

        // ==================================================
        // WAIT FOR DELETE
        // ==================================================
        await page.waitForTimeout(3000);

        // ==================================================
        // VERIFY DELETION
        // ==================================================
        const remainingRows =
            page
                .getByRole('row')
                .filter({
                    hasText: 'RC_User_Automaton'
                });

        const remainingCount =
            await remainingRows.count();

        if (remainingCount === 0) {

            console.log(
                'SUCCESS: All RC_User_Automaton users deleted.'
            );

        } else {

            console.log(
                `WARNING: ${remainingCount} RC_User_Automaton row(s) still visible.`
            );
        }

        await hold();
    };

    // ==================================================
    // 7. SEARCH EXISTING USERS
    // ==================================================
    await searchAutomationUsers();
    await hold();

    // ==================================================
    // 8. DELETE EXISTING USERS
    // ==================================================
    await deleteAllFilteredUsers();

    // ==================================================
    // 9. AUTOMATION USER CONFIGURATION
    // 6 GROUP TYPES x 4 ENDPOINT MODES = 24 USERS
    //
    // Endpoint modes:
    // 1. WebRTC
    // 2. Mobile
    // 3. Softphone/IP-phone - Create New Extension
    // 4. Softphone/IP-phone - Use Existing Extension
    //
    // Campaign Supervisor and Operator:
    // - Select at least 5 campaigns.
    // ==================================================

    type UserGroupType =
        | 'Agent'
        | 'Supervisor'
        | 'Campaign Supervisor'
        | 'Supervisor TL'
        | 'Operator'
        | 'Wallboard';

    type EndpointType =
        | 'WebRTC'
        | 'Mobile'
        | 'Softphone/IP-phone';

    type ExtensionMode =
        | 'create'
        | 'existing';

    interface AutomationUserConfig {
        userIndex: number;
        groupType: UserGroupType;
        endpoint: EndpointType;
        extensionMode?: ExtensionMode;
        campaignCount?: number;
    }

    const groupTypes: UserGroupType[] = [
        'Agent',
        'Supervisor',
        'Campaign Supervisor',
        'Supervisor TL',
        'Operator',
        'Wallboard'
    ];

    const endpointModes: Array<{
        endpoint: EndpointType;
        extensionMode?: ExtensionMode;
    }> = [
        { endpoint: 'WebRTC' },
        { endpoint: 'Mobile' },
        {
            endpoint: 'Softphone/IP-phone',
            extensionMode: 'create'
        },
        {
            endpoint: 'Softphone/IP-phone',
            extensionMode: 'existing'
        }
    ];

    const automationUsers: AutomationUserConfig[] = [];

    let userIndex = 1;

    for (const groupType of groupTypes) {
        for (const endpointMode of endpointModes) {
            automationUsers.push({
                userIndex,
                groupType,
                endpoint: endpointMode.endpoint,
                extensionMode: endpointMode.extensionMode,
                campaignCount:
                    groupType === 'Campaign Supervisor' ||
                    groupType === 'Operator'
                        ? 5
                        : undefined
            });

            userIndex++;
        }
    }

    console.log(
        `Total automation users configured: ${automationUsers.length}`
    );

    if (automationUsers.length !== 24) {
        throw new Error(
            `Expected 24 automation users but generated ${automationUsers.length}.`
        );
    }

    // ==================================================
    // RUN-LEVEL UNIQUENESS TRACKING
    // Values found to already exist are blocked for all
    // later users. Successfully assigned values are also
    // reserved so they are never reused in this run.
    // ==================================================
    const reservedMobileNumbers = new Set<string>();
    const blockedMobileNumbers = new Set<string>();
    const reservedEmailAddresses = new Set<string>();
    const blockedEmailAddresses = new Set<string>();
    const reservedExtensions = new Set<string>();
    const blockedExtensions = new Set<string>();

    // ==================================================
    // HELPER: SELECT ENDPOINT
    // ==================================================
    const selectEndpoint = async (
        endpoint: EndpointType
    ) => {
        const endpointDropdown =
            page.getByRole('combobox').nth(1);

        await expect(endpointDropdown).toBeVisible({
            timeout: 10000
        });

        await endpointDropdown.click();
        await hold();

        let endpointOption =
            page.getByRole('option', {
                name: endpoint,
                exact: true
            }).first();

        if (
            await endpointOption.count() === 0 &&
            endpoint === 'Softphone/IP-phone'
        ) {
            endpointOption =
                page.getByRole('option')
                    .filter({
                        hasText: /softphone\/ip-phone|softphone|ip-phone/i
                    })
                    .first();
        }

        await expect(endpointOption).toBeVisible({
            timeout: 10000
        });

        await endpointOption.click();
        await hold();

        console.log(
            `Endpoint selected: ${endpoint}`
        );
    };

    // ==================================================
    // HELPER: CONFIGURE MOBILE ENDPOINT
    // ==================================================
    const configureMobileEndpoint = async (
        user: AutomationUserConfig
    ) => {
        const mobileEndpointNumber =
            `9206756${String(user.userIndex).padStart(3, '0')}`;

        const mobileEndpointField =
            page.getByLabel('Mobile Number').last();

        await expect(mobileEndpointField).toBeVisible({
            timeout: 10000
        });

        await hold();

        await mobileEndpointField.fill(
            mobileEndpointNumber
        );

        await hold();

        console.log(
            `Mobile Endpoint Number: ${mobileEndpointNumber}`
        );

        // ==================================================
        // USE CAMPAIGN SPECIFIC GATEWAY
        // If blank -> select Default Gateway.
        // If already selected -> keep it.
        // ==================================================
        const gatewayLabel =
            page.getByText(
                'Use Campaign Specific Gateway',
                { exact: true }
            ).first();

        await expect(gatewayLabel).toBeVisible({
            timeout: 10000
        });

        await hold();

        const gatewayContainer =
            gatewayLabel.locator(
                'xpath=ancestor::div[.//*[@role="combobox"]][1]'
            );

        const gatewayDropdown =
            gatewayContainer
                .getByRole('combobox')
                .first();

        await expect(gatewayDropdown).toBeVisible({
            timeout: 10000
        });

        await hold();

        const gatewayValue =
            (
                await gatewayDropdown.textContent()
            )?.trim() || '';

        console.log(
            `Current gateway value: ${gatewayValue || '[BLANK]'}`
        );

        if (!gatewayValue) {
            await gatewayDropdown.click();
            await hold();

            const defaultGateway =
                page.getByRole('option', {
                    name: 'Default Gateway',
                    exact: true
                }).first();

            await expect(defaultGateway).toBeVisible({
                timeout: 10000
            });

            await defaultGateway.click();
            await hold();

            console.log(
                'Default Gateway selected.'
            );
        } else {
            console.log(
                `Gateway already selected: ${gatewayValue}`
            );
            await hold();
        }
    };

    // ==================================================
    // HELPER: CREATE NEW EXTENSION
    // Uses the already-working retry/validation logic.
    // ==================================================
    const createNewExtension = async (
        userName: string
    ) => {
        const createNewExtensionRadio =
            page.getByRole('radio', {
                name: /Create New Extension/i
            }).first();

        await expect(createNewExtensionRadio).toBeVisible({
            timeout: 10000
        });

        await hold();

        await createNewExtensionRadio.check();
        await hold();

        console.log(
            `${userName}: Extension operation = Create New Extension`
        );

        const extensionNumberField =
            page.getByLabel(/Extension Number/i).first();

        const extensionPasswordField =
            page.getByLabel(/Extension Password/i).first();

        const confirmExtensionPasswordField =
            page.getByLabel(/Confirm Extension Password/i).first();

        await expect(extensionNumberField).toBeVisible({
            timeout: 10000
        });

        await expect(extensionPasswordField).toBeVisible({
            timeout: 10000
        });

        await expect(confirmExtensionPasswordField).toBeVisible({
            timeout: 10000
        });

        let extensionNumber = 1001;
        let extensionAvailable = false;
        const maxExtensionAttempts = 100;

        const getExtensionValidationText = async () => {
            const texts: string[] = [];

            const ariaInvalid =
                await extensionNumberField
                    .getAttribute('aria-invalid')
                    .catch(() => null);

            if (ariaInvalid) {
                texts.push(`aria-invalid=${ariaInvalid}`);
            }

            const describedBy =
                await extensionNumberField
                    .getAttribute('aria-describedby')
                    .catch(() => null);

            if (describedBy) {
                for (
                    const id of describedBy
                        .split(/\s+/)
                        .filter(Boolean)
                ) {
                    const describedText =
                        await extensionNumberField.evaluate(
                            (field, describedId) => {
                                const describedElement =
                                    document.getElementById(
                                        describedId
                                    );

                                return describedElement?.innerText ||
                                    describedElement?.textContent ||
                                    '';
                            },
                            id
                        ).catch(() => '');

                    if (describedText.trim()) {
                        texts.push(describedText);
                    }
                }
            }

            const containers = [
                extensionNumberField.locator('xpath=..'),
                extensionNumberField.locator('xpath=../..'),
                extensionNumberField.locator('xpath=../../..')
            ];

            for (const container of containers) {
                if (await container.count() > 0) {
                    texts.push(
                        await container.innerText().catch(() => '')
                    );
                }
            }

            const visibleErrors = page.locator(
                '[role="alert"], .MuiFormHelperText-root, .Mui-error, .error, .invalid-feedback, [class*="error" i]'
            );

            const errorCount =
                await visibleErrors.count();

            for (
                let n = 0;
                n < errorCount;
                n++
            ) {
                const error = visibleErrors.nth(n);

                if (
                    await error.isVisible().catch(() => false)
                ) {
                    texts.push(
                        await error.innerText().catch(() => '')
                    );
                }
            }

            return texts.join(' | ');
        };

        const extensionIsDuplicate =
            (validationText: string) => {
                return /(?:extension|number).*?(?:already\s+exists|already\s+in\s+use|exists|duplicate)|(?:already\s+exists|already\s+in\s+use|duplicate).*?(?:extension|number)/i
                    .test(validationText);
            };

        for (
            let attempt = 1;
            attempt <= maxExtensionAttempts;
            attempt++
        ) {
            const candidateExtension =
                String(extensionNumber).padStart(4, '0');

            if (
                reservedExtensions.has(candidateExtension) ||
                blockedExtensions.has(candidateExtension)
            ) {
                console.log(
                    `${userName}: Extension ${candidateExtension} is already reserved/blocked in this run. Trying next extension...`
                );
                extensionNumber++;
                continue;
            }

            if (!/^\d{4}$/.test(candidateExtension)) {
                throw new Error(
                    `Invalid extension generated: ${candidateExtension}.`
                );
            }

            console.log(
                `${userName}: Trying extension ${candidateExtension} (attempt ${attempt}/${maxExtensionAttempts})`
            );

            await extensionNumberField.fill('');
            await hold();

            await extensionNumberField.fill(
                candidateExtension
            );

            await hold();

            await extensionNumberField
                .press('Tab')
                .catch(() => {});

            await hold();

            await page.waitForTimeout(800);

            const validationText =
                await getExtensionValidationText();

            const invalidState =
                (await extensionNumberField
                    .getAttribute('aria-invalid')
                    .catch(() => null)) === 'true';

            const duplicateFound =
                extensionIsDuplicate(validationText);

            console.log(
                `${userName}: Extension ${candidateExtension} validation: ${JSON.stringify({
                    duplicateFound,
                    invalidState,
                    validationText: validationText.slice(0, 500)
                })}`
            );

            if (duplicateFound) {
                blockedExtensions.add(candidateExtension);
                extensionNumber++;
                await hold();
                continue;
            }

            if (invalidState) {
                extensionNumber++;
                await hold();
                continue;
            }

            extensionAvailable = true;
            extensionNumber =
                Number(candidateExtension);
            reservedExtensions.add(candidateExtension);

            console.log(
                `${userName}: Extension ${candidateExtension} is available and reserved for this run.`
            );

            break;
        }

        if (!extensionAvailable) {
            throw new Error(
                `${userName}: Could not find an available 4-digit extension after ${maxExtensionAttempts} attempts.`
            );
        }

        const extensionPassword =
            'Test@12345';

        await extensionPasswordField.fill(
            extensionPassword
        );

        await hold();

        await confirmExtensionPasswordField.fill(
            extensionPassword
        );

        await hold();

        console.log(
            `${userName}: New extension ${extensionNumber} configured.`
        );
    };

    // ==================================================
    // HELPER: SELECT EXISTING EXTENSION
    // Custom/MUI dropdown handling.
    // ==================================================
    const selectExistingExtension = async (
        userName: string
    ) => {
        const useExistingExtensionRadio =
            page.getByRole('radio', {
                name: /Use Existing Extension/i
            }).first();

        await expect(useExistingExtensionRadio).toBeVisible({
            timeout: 10000
        });

        await hold();

        await useExistingExtensionRadio.check();
        await hold();

        console.log(
            `${userName}: Extension operation = Use Existing Extension`
        );

        const extensionCandidates = [
            page.locator(
                '#mui-component-select-extension_uuid'
            ).first(),

            page.locator(
                '[id*="extension"][id*="select"]'
            ).first(),

            page.locator(
                '[role="combobox"]'
            ).filter({
                hasText: /select.*extension|extension/i
            }).first(),

            page.getByText(
                /select.*extension/i
            ).first(),

            page.getByText(
                /^\s*\d{4}\s*$/
            ).first()
        ];

        let existingExtensionDropdown: any = null;

        for (const candidate of extensionCandidates) {
            if (
                await candidate.count() > 0 &&
                await candidate.isVisible().catch(() => false)
            ) {
                existingExtensionDropdown =
                    candidate;
                break;
            }
        }

        if (!existingExtensionDropdown) {
            const visibleComboboxes =
                page.locator('[role="combobox"]');

            const comboCount =
                await visibleComboboxes.count();

            for (
                let n = 0;
                n < comboCount;
                n++
            ) {
                const combo =
                    visibleComboboxes.nth(n);

                if (
                    !await combo.isVisible().catch(() => false)
                ) {
                    continue;
                }

                const text =
                    (
                        await combo.innerText()
                            .catch(() => '')
                    ).trim();

                const ariaLabel =
                    (
                        await combo
                            .getAttribute('aria-label')
                            .catch(() => null)
                    ) || '';

                const name =
                    (
                        await combo
                            .getAttribute('name')
                            .catch(() => null)
                    ) || '';

                const id =
                    (
                        await combo
                            .getAttribute('id')
                            .catch(() => null)
                    ) || '';

                if (
                    /extension|select/i.test(
                        `${text} ${ariaLabel} ${name} ${id}`
                    )
                ) {
                    existingExtensionDropdown =
                        combo;
                    break;
                }
            }
        }

        if (!existingExtensionDropdown) {
            throw new Error(
                `${userName}: Existing Extension dropdown was not found.`
            );
        }

        await expect(
            existingExtensionDropdown
        ).toBeVisible({
            timeout: 10000
        });

        await hold();

        await existingExtensionDropdown.click({
            force: true
        });

        await hold();

        const extensionOptions =
            page.locator('[role="option"]')
                .filter({
                    hasText: /^\s*\d{4}\s*$/
                });

        const extensionOptionCount =
            await extensionOptions.count();

        if (extensionOptionCount === 0) {
            throw new Error(
                `${userName}: No 4-digit existing extension is available in the opened dropdown.`
            );
        }

        let existingExtensionOption: any = null;
        let selectedExistingExtension = '';

        for (let i = 0; i < extensionOptionCount; i++) {
            const option = extensionOptions.nth(i);

            if (!await option.isVisible().catch(() => false)) {
                continue;
            }

            const value = (await option.textContent().catch(() => ''))?.trim() || '';

            if (
                /^\d{4}$/.test(value) &&
                !reservedExtensions.has(value) &&
                !blockedExtensions.has(value)
            ) {
                existingExtensionOption = option;
                selectedExistingExtension = value;
                break;
            }
        }

        if (!existingExtensionOption || !selectedExistingExtension) {
            throw new Error(
                `${userName}: All visible existing extensions are already reserved/blocked in this run.`
            );
        }

        console.log(
            `${userName}: Selecting existing extension ${selectedExistingExtension}...`
        );

        await existingExtensionOption.click();
        await hold();

        reservedExtensions.add(selectedExistingExtension);

        console.log(
            `${userName}: Existing extension selected = ${selectedExistingExtension}`
        );
    };

    // ==================================================
    // HELPER: SELECT GROUP TYPE
    // ==================================================
    const selectGroupType = async (
        groupType: UserGroupType
    ) => {
        const groupTypeDropdown =
            page.locator(
                '#mui-component-select-group_type'
            );

        await expect(groupTypeDropdown).toBeVisible({
            timeout: 10000
        });

        await groupTypeDropdown.click();
        await hold();

        const groupTypeOption =
            page.getByRole('option', {
                name: groupType,
                exact: true
            }).first();

        await expect(groupTypeOption).toBeVisible({
            timeout: 10000
        });

        await groupTypeOption.click();
        await hold();

        console.log(
            `Group Type selected: ${groupType}`
        );

        const groupTypeMenu =
            page.locator('#menu-group_type');

        if (await groupTypeMenu.count() > 0) {
            await expect(groupTypeMenu).toBeHidden({
                timeout: 10000
            }).catch(() => {});
        }

        await hold();
    };

    // ==================================================
    // HELPER: SELECT GROUP
    //
    // Group options are selected dynamically because
    // the available Group values depend on Group Type.
    // ==================================================
    const selectGroup = async (
        groupType: UserGroupType
    ) => {
        const groupDropdown =
            page.locator(
                '#mui-component-select-group_uuid'
            );

        await expect(groupDropdown).toBeVisible({
            timeout: 10000
        });

        await hold();

        await groupDropdown.click();
        await hold();

        const allOptions =
            page.getByRole('option');

        const optionTexts =
            (
                await allOptions.allTextContents()
            )
                .map(text => text.trim())
                .filter(text =>
                    text.length > 0 &&
                    !/^select/i.test(text)
                );

        if (optionTexts.length === 0) {
            throw new Error(
                `No Group options found for Group Type: ${groupType}`
            );
        }

        console.log(
            `Available groups for ${groupType}: ${optionTexts.join(', ')}`
        );

        const selectedGroupName =
            optionTexts[0];

        const selectedGroupOption =
            page.getByRole('option', {
                name: selectedGroupName,
                exact: true
            }).first();

        await expect(
            selectedGroupOption
        ).toBeVisible({
            timeout: 10000
        });

        await selectedGroupOption.click();
        await hold();

        console.log(
            `Group selected for ${groupType}: ${selectedGroupName}`
        );

        return selectedGroupName;
    };

    // ==================================================
    // HELPER: SELECT CAMPAIGNS
    //
    // Campaign Supervisor and Operator require at least
    // 5 campaigns.
    //
    // Supports:
    // - native <select multiple>
    // - MUI/custom multi-select using role=option
    // ==================================================
    const selectCampaigns = async (
        minimumCampaigns: number,
        groupType: UserGroupType
    ) => {
        console.log(
            `${groupType}: Selecting ${minimumCampaigns} random campaigns...`
        );

        const campaignLabel = page
            .getByText(/^Campaigns\s*\*?$/i)
            .last();

        await expect(campaignLabel).toBeVisible({
            timeout: 10000
        });

        await hold();

        const campaignContainer = campaignLabel.locator(
            'xpath=ancestor::*[.//select or .//*[@role="combobox"] or .//*[@role="button"]][1]'
        );

        let nativeCampaignSelect = campaignContainer
            .locator('select')
            .first();

        let campaignControl: any = null;

        if (
            await nativeCampaignSelect.count() > 0 &&
            await nativeCampaignSelect.isVisible().catch(() => false)
        ) {
            campaignControl = nativeCampaignSelect;
        } else {
            const localCombobox = campaignContainer
                .getByRole('combobox')
                .first();

            if (
                await localCombobox.count() > 0 &&
                await localCombobox.isVisible().catch(() => false)
            ) {
                campaignControl = localCombobox;
            }
        }

        if (!campaignControl) {
            const candidates = [
                page.locator('[id*="campaign" i]').first(),
                page.locator('[name*="campaign" i]').first(),
                page.getByRole('combobox').filter({
                    hasText: /campaign/i
                }).first(),
                page.locator('select').filter({
                    has: page.locator('option')
                }).last()
            ];

            for (const candidate of candidates) {
                if (
                    await candidate.count() > 0 &&
                    await candidate.isVisible().catch(() => false)
                ) {
                    campaignControl = candidate;
                    break;
                }
            }
        }

        if (!campaignControl) {
            throw new Error(
                `${groupType}: Campaign dropdown/control beside Campaigns * was not found.`
            );
        }

        // --------------------------------------------------
        // Native <select multiple>
        // --------------------------------------------------
        if (
            await campaignControl.evaluate(
                (el: HTMLElement) => el.tagName.toLowerCase() === 'select'
            ).catch(() => false)
        ) {
            const nativeOptions = campaignControl.locator('option');
            const optionCount = await nativeOptions.count();
            const availableCampaigns: Array<{ value: string; text: string }> = [];

            for (let i = 0; i < optionCount; i++) {
                const option = nativeOptions.nth(i);
                const text = (await option.textContent())?.trim() || '';
                const value = await option.getAttribute('value');

                if (
                    text &&
                    value &&
                    !/^select/i.test(text) &&
                    !/^choose/i.test(text) &&
                    !/^campaigns?\s*\*?$/i.test(text)
                ) {
                    availableCampaigns.push({ value, text });
                }
            }

            if (availableCampaigns.length < minimumCampaigns) {
                throw new Error(
                    `${groupType}: Only ${availableCampaigns.length} campaigns are available. At least ${minimumCampaigns} are required.`
                );
            }

            // Fisher-Yates shuffle for random unique selection.
            for (let i = availableCampaigns.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [availableCampaigns[i], availableCampaigns[j]] =
                    [availableCampaigns[j], availableCampaigns[i]];
            }

            const selectedCampaigns = availableCampaigns.slice(0, minimumCampaigns);

            await campaignControl.selectOption(
                selectedCampaigns.map(campaign => campaign.value)
            );

            await hold();

            console.log(
                `${groupType}: Random campaigns selected: ${selectedCampaigns.map(campaign => campaign.text).join(', ')}`
            );

            return;
        }

        // --------------------------------------------------
        // Custom / MUI multi-select
        // IMPORTANT:
        // After every campaign selection, reopen the SAME
        // Campaigns control and read the CURRENTLY rendered
        // options again. This avoids stale/dynamic option
        // locators and prevents duplicate campaign selection.
        // --------------------------------------------------
        const selectedCampaignNames = new Set<string>();

        const clickCampaignControlBlankArea = async () => {
            const box = await campaignControl.boundingBox().catch(() => null);

            if (box && box.width > 20 && box.height > 10) {
                // Click the right-side padding/blank area of the same control.
                // This is the user's intended action to reopen the list.
                await page.mouse.click(
                    box.x + Math.max(5, box.width - 10),
                    box.y + box.height / 2
                );
            } else {
                await campaignControl.click({ force: true });
            }

            await hold();
        };

        const readVisibleCurrentCampaignOptions = async (): Promise<string[]> => {
            const options = page.getByRole('option');
            const count = await options.count();
            const names: string[] = [];

            for (let i = 0; i < count; i++) {
                const option = options.nth(i);

                if (!await option.isVisible().catch(() => false)) {
                    continue;
                }

                const text = (await option.innerText().catch(() => '')).trim();

                if (
                    text &&
                    !/^select/i.test(text) &&
                    !/^choose/i.test(text) &&
                    !/^campaigns?\s*\*?$/i.test(text) &&
                    !selectedCampaignNames.has(text) &&
                    !names.includes(text)
                ) {
                    names.push(text);
                }
            }

            return names;
        };

        const clickCurrentVisibleCampaign = async (campaignName: string) => {
            // Do NOT create a new getByRole('option', name) locator here.
            // Re-read the currently rendered options and click that exact
            // current option instance immediately.
            const options = page.getByRole('option');
            const count = await options.count();

            for (let i = 0; i < count; i++) {
                const option = options.nth(i);

                if (!await option.isVisible().catch(() => false)) {
                    continue;
                }

                const text = (await option.innerText().catch(() => '')).trim();

                if (text === campaignName) {
                    await option.click();
                    return true;
                }
            }

            return false;
        };

        for (let selectionNumber = 1; selectionNumber <= minimumCampaigns; selectionNumber++) {
            console.log(
                `${groupType}: Opening Campaigns dropdown for selection ${selectionNumber}/${minimumCampaigns}...`
            );

            // Reopen the SAME dropdown/control for every campaign.
            await clickCampaignControlBlankArea();

            const availableCurrentOptions =
                await readVisibleCurrentCampaignOptions();

            if (availableCurrentOptions.length === 0) {
                throw new Error(
                    `${groupType}: No new visible campaign options are available for selection ${selectionNumber}. Already selected: ${Array.from(selectedCampaignNames).join(', ')}`
                );
            }

            // Randomly choose from the CURRENT reopened list.
            const randomIndex = Math.floor(
                Math.random() * availableCurrentOptions.length
            );

            const selectedCampaign =
                availableCurrentOptions[randomIndex];

            console.log(
                `${groupType}: Current dropdown options for selection ${selectionNumber}: ${availableCurrentOptions.join(', ')}`
            );

            console.log(
                `${groupType}: Randomly selected campaign ${selectionNumber}: ${selectedCampaign}`
            );

            const clicked =
                await clickCurrentVisibleCampaign(selectedCampaign);

            if (!clicked) {
                throw new Error(
                    `${groupType}: Campaign option "${selectedCampaign}" disappeared before it could be clicked. The dropdown may have re-rendered.`
                );
            }

            selectedCampaignNames.add(selectedCampaign);
            await hold();

            console.log(
                `${groupType}: Campaign ${selectedCampaign} selected successfully. ${selectedCampaignNames.size}/${minimumCampaigns}`
            );
        }

        console.log(
            `${groupType}: Successfully selected ${selectedCampaignNames.size} random campaigns: ${Array.from(selectedCampaignNames).join(', ')}`
        );
    };

    // ==================================================
    // HELPER: CONFIGURE GROUP-SPECIFIC SETTINGS
    // ==================================================
    const configureGroup =
        async (user: AutomationUserConfig) => {

            await selectGroupType(
                user.groupType
            );

            const selectedGroup =
                await selectGroup(
                    user.groupType
                );

            // --------------------------------------------------
            // Campaign Supervisor / Operator
            // --------------------------------------------------
            if (
                user.groupType ===
                    'Campaign Supervisor' ||
                user.groupType === 'Operator'
            ) {
                await selectCampaigns(
                    user.campaignCount || 5,
                    user.groupType
                );
            }

            // --------------------------------------------------
            // Agent
            //
            // The existing application displays the
            // Manage Queue Agent section for Agent.
            // --------------------------------------------------
            const manageQueueSection =
                page.getByText(
                    'Manage Queue Agent',
                    { exact: true }
                ).first();

            const queueVisible =
                await manageQueueSection
                    .isVisible()
                    .catch(() => false);

            if (queueVisible) {
                await hold();

                console.log(
                    `${user.groupType}: Manage Queue Agent section is visible.`
                );

                const manageQueueContainer =
                    manageQueueSection.locator(
                        'xpath=ancestor::div[.//*[@role="combobox"]][1]'
                    );

                const queueNameDropdown =
                    manageQueueContainer
                        .getByRole('combobox')
                        .first();

                await expect(
                    queueNameDropdown
                ).toBeVisible({
                    timeout: 10000
                });

                await queueNameDropdown.click();
                await hold();

                const queueOptions =
                    page.getByRole('option');

                const queueNames =
                    (
                        await queueOptions
                            .allTextContents()
                    )
                        .map(queueName =>
                            queueName.trim()
                        )
                        .filter(queueName =>
                            queueName.length > 0 &&
                            !/^select/i.test(queueName)
                        );

                if (queueNames.length === 0) {
                    throw new Error(
                        `No queue options found for ${user.groupType}.`
                    );
                }

                const selectedQueueName =
                    queueNames[
                        Math.floor(
                            Math.random() *
                            queueNames.length
                        )
                    ];

                const selectedQueueOption =
                    queueOptions.filter({
                        hasText: new RegExp(
                            `^${selectedQueueName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`
                        )
                    }).first();

                await selectedQueueOption.click();
                await hold();

                console.log(
                    `${user.groupType}: Queue selected = ${selectedQueueName}`
                );
            } else {
                console.log(
                    `${user.groupType}: Manage Queue Agent section is not displayed. Continuing.`
                );
            }

            return selectedGroup;
        };

    // ==================================================
    // UNIQUE PHONE / EMAIL HELPERS
    // ==================================================
    const fieldAlreadyInUse = async (
        field: any,
        fieldLabel: string
    ): Promise<boolean> => {
        const duplicatePattern =
            /(?:already\s*(?:in\s*use|used|exists)|already\s*registered|duplicate|phone\s*number\s*already\s*exists|mobile\s*number\s*already\s*exists)/i;

        const texts: string[] = [];

        const describedBy =
            await field.getAttribute('aria-describedby').catch(() => null);

        if (describedBy) {
            for (const id of describedBy.split(/\s+/).filter(Boolean)) {
                const text =
                    await page.evaluate((elementId) => {
                        const element = document.getElementById(elementId);
                        return element?.innerText || element?.textContent || '';
                    }, id).catch(() => '');

                if (text.trim()) {
                    texts.push(text);
                }
            }
        }

        const containers = [
            field,
            field.locator('xpath=..'),
            field.locator('xpath=../..'),
            field.locator('xpath=../../..')
        ];

        for (const container of containers) {
            if (await container.count().catch(() => 0) > 0) {
                const text = await container.innerText().catch(() => '');

                if (text.trim()) {
                    texts.push(text);
                }
            }
        }

        const visibleErrors = page.locator(
            '[role="alert"], .MuiFormHelperText-root, .Mui-error, .error, .invalid-feedback, [class*="error" i]'
        );

        const errorCount = await visibleErrors.count();

        for (let i = 0; i < errorCount; i++) {
            const error = visibleErrors.nth(i);

            if (await error.isVisible().catch(() => false)) {
                const errorText = await error.innerText().catch(() => '');

                if (errorText.trim()) {
                    texts.push(errorText);
                }
            }
        }

        const validationText =
            texts.join(' | ').replace(/\s+/g, ' ').trim();

        const duplicateFound =
            duplicatePattern.test(validationText);

        console.log(
            `${fieldLabel} validation: ${JSON.stringify({
                duplicateFound,
                validationText: validationText.slice(0, 500)
            })}`
        );

        return duplicateFound;
    };

    // ==================================================
    // GET UNIQUE MOBILE NUMBER
    //
    // If the UI says the phone/mobile number already
    // exists, automatically try the next number.
    // ==================================================
    const getUniqueMobileNumber = async (
        baseIndex: number
    ): Promise<string> => {
        const field =
            page.getByLabel('Mobile Number').first();

        await expect(field).toBeVisible({
            timeout: 10000
        });

        let index = baseIndex;

        for (
            let attempt = 1;
            attempt <= 100;
            attempt++, index++
        ) {
            const candidate =
                `9106756${String(index).padStart(3, '0')}`;

            if (
                reservedMobileNumbers.has(candidate) ||
                blockedMobileNumbers.has(candidate)
            ) {
                console.log(
                    `Skipping Mobile Number ${candidate}: already reserved/blocked in this run.`
                );
                continue;
            }

            console.log(
                `Checking Mobile Number ${candidate} (attempt ${attempt}/100)...`
            );

            await field.fill('');
            await field.fill(candidate);

            // Trigger UI/server-side validation.
            await field.press('Tab').catch(() => {});
            await page.waitForTimeout(1200);

            const duplicateFound =
                await fieldAlreadyInUse(
                    field,
                    'Mobile Number'
                );

            if (!duplicateFound) {
                console.log(
                    `Mobile Number ${candidate} is available.`
                );

                return candidate;
            }

            blockedMobileNumbers.add(candidate);

            console.log(
                `Mobile Number ${candidate} already exists. It is now blocked for all later users. Trying next number...`
            );

            await field.fill('');
            await page.waitForTimeout(200);
        }

        throw new Error(
            `Unable to find a unique Mobile Number after 100 attempts for user ${baseIndex}.`
        );
    };

    const getUniqueEmail = async (baseIndex: number): Promise<string> => {
        const field = page.getByLabel('Email');
        let index = baseIndex;

        for (let attempt = 0; attempt < 100; attempt++, index++) {
            const candidate = `rcautomation${String(index).padStart(2, '0')}@example.com`;

            if (
                reservedEmailAddresses.has(candidate) ||
                blockedEmailAddresses.has(candidate)
            ) {
                console.log(
                    `Skipping Email ${candidate}: already reserved/blocked in this run.`
                );
                continue;
            }

            await field.fill(candidate);
            await field.press('Tab');
            await page.waitForTimeout(500);

            if (!(await fieldAlreadyInUse(field, 'Email'))) {
                console.log(`Unique Email selected: ${candidate}`);
                return candidate;
            }

            blockedEmailAddresses.add(candidate);
            console.log(`Email ${candidate} is already in use. It is now blocked for all later users. Trying next email...`);
        }

        throw new Error(`Unable to find a unique Email for user ${baseIndex}.`);
    };

    // ==================================================
    // HELPER: DETECT EMAIL DUPLICATE ERROR
    //
    // Some email uniqueness checks are returned only when
    // the user is saved. If that happens, generate another
    // email and save the same user again.
    // ==================================================
    const emailDuplicateShown = async (): Promise<boolean> => {
        const duplicatePattern =
            /(?:email|e-mail).{0,80}(?:already\s*(?:exists|in\s*use|used|registered)|duplicate)|(?:already\s*(?:exists|in\s*use|used|registered)|duplicate).{0,80}(?:email|e-mail)/i;

        const texts: string[] = [];

        const visibleAlerts = page.locator(
            '[role="alert"], .MuiAlert-root, .MuiFormHelperText-root, .Mui-error, .error, .invalid-feedback, [class*="error" i], [class*="toast" i], [class*="snackbar" i]'
        );

        const count = await visibleAlerts.count();

        for (let i = 0; i < count; i++) {
            const element = visibleAlerts.nth(i);

            if (await element.isVisible().catch(() => false)) {
                const value = await element.innerText().catch(() => '');

                if (value.trim()) {
                    texts.push(value);
                }
            }
        }

        // Also inspect visible text from the Add User form.
        const addUserForm = page.getByText(
            'Add User',
            { exact: true }
        ).first();

        if (
            await addUserForm.count() > 0 &&
            await addUserForm.isVisible().catch(() => false)
        ) {
            const formContainer =
                addUserForm.locator(
                    'xpath=ancestor::*[.//input][1]'
                );

            if (await formContainer.count() > 0) {
                texts.push(
                    await formContainer.innerText().catch(() => '')
                );
            }
        }

        const combinedText =
            texts.join(' | ')
                .replace(/\s+/g, ' ')
                .trim();

        const duplicateFound =
            duplicatePattern.test(combinedText);

        if (duplicateFound) {
            console.log(
                `Email duplicate error detected: ${combinedText.slice(0, 500)}`
            );
        }

        return duplicateFound;
    };

    // ==================================================
    // HELPER: CAPTURE SAVE FAILURE DETAILS
    //
    // When Save does not create the user, collect as much
    // diagnostic information as possible instead of throwing
    // a generic error. This includes visible validation text,
    // alerts, form errors, URL/state, and API responses seen
    // around the Save action.
    // ==================================================
    const collectSaveFailureDetails = async (
        userName: string,
        attemptedEmail: string,
        saveResponses: Array<{
            url: string;
            status: number;
            statusText: string;
            body: string;
        }>
    ): Promise<string> => {
        const details: string[] = [];

        const collectText = async (locator: any, label: string) => {
            const count = await locator.count().catch(() => 0);

            for (let i = 0; i < count; i++) {
                const element = locator.nth(i);

                if (await element.isVisible().catch(() => false)) {
                    const value = (await element.innerText().catch(() => ''))
                        .replace(/\\s+/g, ' ')
                        .trim();

                    if (value) {
                        details.push(`${label}: ${value}`);
                    }
                }
            }
        };

        // --------------------------------------------------
        // VISIBLE ALERTS / TOASTS / VALIDATION ERRORS
        // --------------------------------------------------
        await collectText(
            page.locator(
                '[role="alert"], .MuiAlert-root, .MuiSnackbar-root, .MuiFormHelperText-root, .Mui-error, .error, .invalid-feedback, [class*="error" i], [class*="toast" i], [class*="snackbar" i]'
            ),
            'UI error'
        );

        // --------------------------------------------------
        // ADD USER FORM TEXT
        // --------------------------------------------------
        const addUserHeading = page.getByText(
            'Add User',
            { exact: true }
        ).first();

        if (
            await addUserHeading.count() > 0 &&
            await addUserHeading.isVisible().catch(() => false)
        ) {
            const form = addUserHeading.locator(
                'xpath=ancestor::*[.//input][1]'
            );

            if (await form.count() > 0) {
                const formText = (await form.innerText().catch(() => ''))
                    .replace(/\\s+/g, ' ')
                    .trim();

                if (formText) {
                    details.push(`Add User form: ${formText.slice(0, 3000)}`);
                }
            }
        }

        // --------------------------------------------------
        // INVALID INPUTS
        // --------------------------------------------------
        const invalidInputs = page.locator(
            'input[aria-invalid="true"], textarea[aria-invalid="true"], select[aria-invalid="true"]'
        );

        const invalidCount = await invalidInputs.count();

        for (let i = 0; i < invalidCount; i++) {
            const input = invalidInputs.nth(i);
            const name =
                await input.getAttribute('name').catch(() => '') ||
                await input.getAttribute('id').catch(() => '') ||
                await input.getAttribute('aria-label').catch(() => '') ||
                'unknown-field';

            const value = await input.inputValue().catch(() => '');
            details.push(`Invalid field: ${name}=${value}`);
        }

        // --------------------------------------------------
        // BUTTON STATE
        // --------------------------------------------------
        const saveButtonState = page.getByRole('button', {
            name: /^save$/i
        }).first();

        if (await saveButtonState.count() > 0) {
            details.push(
                `Save button: visible=${await saveButtonState.isVisible().catch(() => false)}, enabled=${await saveButtonState.isEnabled().catch(() => false)}`
            );
        }

        // --------------------------------------------------
        // CURRENT PAGE STATE
        // --------------------------------------------------
        details.push(`Current URL: ${page.url()}`);
        details.push(`Attempted email: ${attemptedEmail}`);

        // --------------------------------------------------
        // API / NETWORK RESPONSES
        // --------------------------------------------------
        if (saveResponses.length > 0) {
            for (const response of saveResponses.slice(-10)) {
                details.push(
                    `API response: ${response.status} ${response.statusText} ${response.url} | body=${response.body.slice(0, 2000)}`
                );
            }
        } else {
            details.push('API response: No response captured during Save wait.');
        }

        // --------------------------------------------------
        // BODY TEXT FALLBACK
        // --------------------------------------------------
        if (details.length === 3 || details.length === 4) {
            const bodyText = (await page.locator('body').innerText().catch(() => ''))
                .replace(/\\s+/g, ' ')
                .trim();

            if (bodyText) {
                details.push(`Page body: ${bodyText.slice(0, 5000)}`);
            }
        }

        return [
            `${userName}: Save failed.`,
            ...details
        ].join('\\n');
    };

    // ==================================================
    // GENERATE NEXT EMAIL
    // ==================================================
    const getNextAutomationEmail = (
        baseIndex: number,
        attempt: number
    ): string => {
        const emailIndex =
            baseIndex + attempt;

        return (
            `rcautomation${String(emailIndex).padStart(2, '0')}@example.com`
        );
    };

    // ==================================================
    // 10. CREATE ALL 24 USERS
    // ==================================================
    for (
        const user of automationUsers
    ) {
        const endpointLabel =
            user.endpoint === 'Softphone/IP-phone'
                ? `Softphone_${user.extensionMode === 'create' ? 'Create' : 'Existing'}`
                : user.endpoint;

        const groupLabel =
            user.groupType
                .replace(/\s+/g, '');

        const userName =
            `RC_User_Automaton_${String(user.userIndex).padStart(2, '0')}`;

        const firstName =
            `Automation_${groupLabel}_${endpointLabel}`;

        const lastName =
            'User';

        console.log(
            `\n========== Creating User ${user.userIndex} of ${automationUsers.length} ==========`
        );

        console.log(
            JSON.stringify({
                username: userName,
                firstName,
                lastName,
                groupType: user.groupType,
                endpoint: user.endpoint,
                extensionMode: user.extensionMode || null,
                campaignCount: user.campaignCount || 0
            })
        );

        // ==================================================
        // ADD USER
        // ==================================================
        const addUserButton =
            page.getByRole('button', {
                name: /add user/i
            });

        await expect(addUserButton).toBeVisible({
            timeout: 10000
        });

        await hold();

        await addUserButton.click();
        await hold();

        await expect(
            page.getByText(
                'Add User',
                { exact: true }
            )
        ).toBeVisible({
            timeout: 10000
        });

        await hold();

        // ==================================================
        // USERNAME
        // ==================================================
        await page
            .getByLabel('Username')
            .fill(userName);

        await hold();

        // ==================================================
        // PASSWORD
        // ==================================================
        const newUserPassword =
            'Test@12345';

        await page
            .locator('input[type="password"]')
            .nth(0)
            .fill(newUserPassword);

        await hold();

        await page
            .locator('input[type="password"]')
            .nth(1)
            .fill(newUserPassword);

        await hold();

        // ==================================================
        // USAGE TYPE = CALLCENTER
        // ==================================================
        const usageTypeDropdown =
            page.getByRole('combobox').nth(0);

        await usageTypeDropdown.click();
        await hold();

        await page.getByRole('option', {
            name: 'Callcenter',
            exact: true
        }).click();

        await hold();

        console.log(
            `${userName}: Usage Type = Callcenter`
        );

        // ==================================================
        // ENDPOINT
        // ==================================================
        await selectEndpoint(
            user.endpoint
        );

        // ==================================================
        // ENDPOINT-SPECIFIC CONFIGURATION
        // ==================================================
        if (
            user.endpoint === 'Mobile'
        ) {
            await configureMobileEndpoint(
                user
            );
        }

        if (
            user.endpoint ===
            'Softphone/IP-phone'
        ) {
            if (
                user.extensionMode ===
                'create'
            ) {
                await createNewExtension(
                    userName
                );
            } else {
                await selectExistingExtension(
                    userName
                );
            }
        }

        // ==================================================
        // UNIQUE MOBILE NUMBER
        // The Add User form must be open before checking
        // the Mobile Number field.
        // ==================================================
        const mobileNumber =
            await getUniqueMobileNumber(user.userIndex);

        console.log(
            `${userName}: Unique Mobile Number = ${mobileNumber}`
        );

        // ==================================================
        // FIRST NAME
        // ==================================================
        await page
            .getByLabel('First Name')
            .fill(firstName);

        await hold();

        // ==================================================
        // LAST NAME
        // ==================================================
        await page
            .getByLabel('Last Name')
            .fill(lastName);

        await hold();

        // ==================================================
        // GROUP TYPE / GROUP / CAMPAIGNS / QUEUE
        // ==================================================
        await configureGroup(user);

        // ==================================================
        // UNIQUE EMAIL
        // Email is intentionally generated after group
        // configuration, according to the updated flow.
        // ==================================================
        const email =
            await getUniqueEmail(user.userIndex);

        console.log(
            `${userName}: Unique Email = ${email}`
        );

        await hold();

        // ==================================================
        // SAVE
        //
        // Email uniqueness may be checked by the backend
        // only after Save. If the UI reports that the email
        // already exists, change only the email and retry
        // Save without rebuilding the whole user.
        // ==================================================
        const saveButton =
            page.getByRole('button', {
                name: /^save$/i
            });

        const emailField =
            page.getByLabel('Email').first();

        let saveSuccessful = false;
        const maxEmailSaveAttempts = 20;

        for (
            let emailAttempt = 0;
            emailAttempt < maxEmailSaveAttempts;
            emailAttempt++
        ) {
            let currentEmail =
                emailAttempt === 0
                    ? email
                    : await getUniqueEmail(user.userIndex + emailAttempt);

            if (emailAttempt > 0) {
                console.log(
                    `${userName}: Previous email already exists. Trying new unique email: ${currentEmail}`
                );

                await expect(emailField).toBeVisible({
                    timeout: 10000
                });

                await emailField.fill(currentEmail);

                await emailField.press('Tab').catch(() => {});
                await page.waitForTimeout(800);

                await hold();
            } else {
                console.log(
                    `${userName}: Saving with email: ${currentEmail}`
                );
            }

            await saveButton.scrollIntoViewIfNeeded();
            await hold();

            await expect(saveButton).toBeEnabled({
                timeout: 10000
            });

            // Capture network responses generated by this Save click.
            // The listener is installed immediately before clicking so
            // backend validation/API errors can be printed if Save fails.
            const saveResponses: Array<{
                url: string;
                status: number;
                statusText: string;
                body: string;
            }> = [];

            const saveResponseHandler = async (response: any) => {
                const url = response.url();

                // Keep only likely API/XHR/fetch responses to avoid filling
                // the log with images, fonts and other static resources.
                const resourceType = response.request().resourceType();
                const contentType =
                    (await response.headerValue('content-type').catch(() => '')) || '';

                if (
                    !['xhr', 'fetch'].includes(resourceType) &&
                    !/json|text|javascript/i.test(contentType)
                ) {
                    return;
                }

                let body = '';

                try {
                    body = await response.text();
                } catch {
                    body = '[response body could not be read]';
                }

                saveResponses.push({
                    url,
                    status: response.status(),
                    statusText: response.statusText(),
                    body: body.slice(0, 3000)
                });
            };

            page.on('response', saveResponseHandler);

            try {
                await saveButton.click();
                await hold();

                // Give the backend enough time to return success or a
                // validation/API error. Previously this was only 1.2 sec.
                await page.waitForTimeout(3000);
            } finally {
                page.off('response', saveResponseHandler);
            }

            // --------------------------------------------------
            // SUCCESS CHECK
            // --------------------------------------------------
            const successMessage =
                page.getByText(
                    /User inserted successfully/i
                ).first();

            if (
                await successMessage.count() > 0 &&
                await successMessage.isVisible().catch(() => false)
            ) {
                saveSuccessful = true;

                reservedMobileNumbers.add(mobileNumber);
                reservedEmailAddresses.add(currentEmail);

                console.log(
                    `SUCCESS: ${userName} created with email ${currentEmail}. Mobile ${mobileNumber} and endpoint values are now reserved for this run.`
                );

                break;
            }

            // --------------------------------------------------
            // EMAIL DUPLICATE CHECK
            // --------------------------------------------------
            const duplicateEmail =
                await emailDuplicateShown();

            if (duplicateEmail) {
                blockedEmailAddresses.add(currentEmail);

                console.log(
                    `${userName}: Email ${currentEmail} already exists. It is now blocked for all later users. Retrying with another email...`
                );

                await hold();
                continue;
            }

            // --------------------------------------------------
            // UNKNOWN SAVE FAILURE
            //
            // Do not throw the old generic message. Collect the
            // actual UI/API validation details so the next failure
            // tells us what prevented the Save operation.
            // --------------------------------------------------
            const saveFailureDetails = await collectSaveFailureDetails(
                userName,
                currentEmail,
                saveResponses
            );

            console.error('\n========== SAVE FAILURE DETAILS ==========');
            console.error(saveFailureDetails);
            console.error('==========================================\n');

            throw new Error(saveFailureDetails);
        }

        if (!saveSuccessful) {
            throw new Error(
                `${userName}: Could not save user after ${maxEmailSaveAttempts} email attempts.`
            );
        }

        await hold();
    }

    // ==================================================
    // 10. FINAL FILTER
    // ==================================================
    console.log(
        'Applying final RC_User_Automaton filter...'
    );

    await searchAutomationUsers();
    await hold();

    // ==================================================
    // 11. VERIFY ALL 24 USERS
    // ==================================================
    for (const user of automationUsers) {

        const endpointLabel =
            user.endpoint === 'Softphone/IP-phone'
                ? `Softphone_${user.extensionMode === 'create' ? 'Create' : 'Existing'}`
                : user.endpoint;

        const groupLabel =
            user.groupType
                .replace(/\s+/g, '');

        const userName =
            `RC_User_Automaton_${String(user.userIndex).padStart(2, '0')}`;

        const userRow =
            page
                .getByRole('row')
                .filter({
                    hasText: userName
                })
                .first();

        await expect(userRow).toBeVisible({
            timeout: 10000
        });

        console.log(
            `Verified: ${userName}`
        );

        await hold();
    }

    console.log(
        `SUCCESS: All ${automationUsers.length} automation users verified.`
    );

    // ==================================================
    // 12. FINAL DELETE
    // ==================================================
    console.log(
        'Starting final cleanup...'
    );

    await deleteAllFilteredUsers();

    // ==================================================
    // 13. KEEP RESULT VISIBLE FOR 5 SECONDS
    // ==================================================
    console.log(
        'Test completed. Browser will close after 5 seconds.'
    );

    await page.waitForTimeout(5000);
});
