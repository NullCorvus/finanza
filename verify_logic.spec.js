const { test, expect } = require('@playwright/test');

test('Verify ICETEX reactive logic and 1.5x rule', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Wait for content to load
  await page.waitForSelector('h2:has-text("CONFIGURACIÓN 2026")');

  // 1. Verify 1.5x Rule
  // Select Semestre 1 to Semestre 6 (6 semesters)
  await page.selectOption('select:near(label:has-text("Inicio Semestre"))', '1');
  await page.selectOption('select:near(label:has-text("Fin Semestre"))', '6');

  // 6 semesters * 6 months/sem * 1.5 = 54 months
  // Check if post_grad_term is 54
  const termText = await page.textContent('div:has-text("Plazo Elegido") + div div.text-xl');
  console.log('Term for 6 semesters:', termText);
  expect(termText).toContain('54 meses');

  // Change to 4 semesters (Semestre 1 to 4)
  await page.selectOption('select:near(label:has-text("Fin Semestre"))', '4');
  // 4 * 6 * 1.5 = 36 months
  const termText2 = await page.textContent('div:has-text("Plazo Elegido") + div div.text-xl');
  console.log('Term for 4 semesters:', termText2);
  expect(termText2).toContain('36 meses');

  // 2. Verify Reactive 0 when ICETEX is disabled
  const icetexCheckbox = page.locator('input[type="checkbox"]:near(div:has-text("Crédito ICETEX 30%"))');
  await icetexCheckbox.uncheck();

  // Check metrics in Post-grad section
  const capital = await page.textContent('div:has-text("Capital Financiado (70%)") + span');
  const interest = await page.textContent('div:has-text("Intereses Causados") + span');
  const totalOwed = await page.textContent('div:has-text("Deuda Total al Empezar Pagos") + span');
  const quota = await page.textContent('div:has-text("Cuota Mensual Proyectada") + div');

  console.log('Metrics when ICETEX inactive:', { capital, interest, totalOwed, quota });
  expect(capital).toContain('$ 0');
  expect(interest).toContain('$ 0');
  expect(totalOwed).toContain('$ 0');
  expect(quota).toContain('$ 0');

  // 3. Verify French Amortization Formula
  await icetexCheckbox.check();
  // Set fixed values for easier calculation verification
  // Let's use 1 semester, .000.000 credit
  await page.selectOption('select:near(label:has-text("Inicio Semestre"))', '1');
  await page.selectOption('select:near(label:has-text("Fin Semestre"))', '1');

  // Need to find the slider for "Monto por semestre"
  // It's in the ICETEX section
  const creditSlider = page.locator('input[type="range"]:near(label:has-text("Monto por semestre"))');
  // Set to 1.000.000. Assuming min 300k, max 3M, step 50k.
  // 1.000.000 is some position.
  await creditSlider.fill('1000000');

  // 1 semester = 6 months
  // Term = 6 * 1.5 = 9 months. Wait, slider min is 12.
  // Oh, 1.5 * 6 = 9. If the slider min is 12, it might stay at 12 or round up.
  // Let's check what it is.
  const currentTerm = await page.textContent('div:has-text("Plazo Elegido") + div div.text-xl');
  console.log('Current Term for 1 semester:', currentTerm);

  // Let's set term to 36 months manually for a known calculation
  const termSlider = page.locator('input[type="range"]:near(div:has-text("Plazo Elegido"))');
  await termSlider.fill('36');

  // Calculation for 1 semester of 1M:
  // totalF = 1.000.000
  // capital = 700.000
  // interest = 700.000 * 0.0114 * ( (1*6)/2 + 6 ) = 700.000 * 0.0114 * 9 = 71.820
  // totalOwed = 771.820
  // Formula: C = (771.820 * 0.0114) / (1 - (1 + 0.0114)^-36)
  // C = 8798.748 / (1 - 0.665...) = 8798.748 / 0.334... = 26284.14...

  const finalQuota = await page.textContent('div:has-text("Cuota Mensual Proyectada") + div');
  console.log('Final Quota calculated:', finalQuota);
  // It should be around $ 26.284
  expect(finalQuota).toContain('$ 26.284');
});
