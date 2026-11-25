import { useState } from 'react';
import { updateSettings } from '../../db/db';
import type { Settings } from '../../db/db';
import { requestPersistence } from '../../db/backupIo';
import { addDays, bakuDate, daysBetween, formatDate, isISODate, jsDay } from '../../logic/dates';
import { BandPicker, Chips, Field, Screen } from '../../ui/components';
import { Icon } from '../../ui/Icon';
import { effectiveStartDate, onboardingDatesValid } from '../../logic/onboarding';

/** Last Saturday of November 2027 (used for "I don't know yet"). */
function lastSaturdayOfNov(year: number): string {
  let d = `${year}-11-30`;
  while (jsDay(d) !== 6) d = addDays(d, -1);
  return d;
}

export function Onboarding({ settings, onDone }: { settings: Settings; onDone: () => void }) {
  const today = bakuDate();
  const [step, setStep] = useState(1);
  const [start, setStart] = useState(settings.startDate);
  const [exam, setExam] = useState(settings.examDate);
  const [estimated, setEstimated] = useState(false);
  const [late, setLate] = useState<'calendar' | 'day1'>('calendar');
  const [target, setTarget] = useState(settings.targetOverall);
  const [minSkill, setMinSkill] = useState<number | null>(settings.targetMinPerSkill);

  const startInPast = isISODate(start) && start < today;
  // Validate the start date that will actually be saved ("Start from Day 1 today" saves today).
  const savedStart = effectiveStartDate(start, late, today);
  const tooShort = isISODate(savedStart) && isISODate(exam) && daysBetween(savedStart, exam) < 56;
  const valid = onboardingDatesValid(start, exam, late, today);

  const finish = async () => {
    if (!onboardingDatesValid(start, exam, late, today)) {
      setStep(2);
      return;
    }
    await updateSettings({
      onboarded: true,
      startDate: savedStart,
      examDate: exam,
      examDateEstimated: estimated,
      targetOverall: target,
      targetMinPerSkill: minSkill,
      firstUseDate: today,
    });
    void requestPersistence();
    onDone();
  };

  return (
    <Screen full>
      <div className="stack" style={{ paddingTop: 16 }}>
        <div className="row">
          {step > 1 ? <button className="back-btn" onClick={() => setStep(step - 1)}><Icon name="back" size={22} /> Back</button> : <span />}
          <span className="spacer" />
          <span className="subhead">{step} of 4</span>
        </div>

        {step === 1 && (
          <div className="stack" style={{ alignItems: 'center', textAlign: 'center', paddingTop: 32 }}>
            <img src="./icons/icon-192.png" alt="" width={88} height={88} style={{ borderRadius: 20 }} />
            <h1 className="title1">Welcome to IELTS Mentor</h1>
            <p className="callout">Your daily guide from B1 to IELTS Academic 7.0+.</p>
            <div className="card stack" style={{ textAlign: 'left', alignSelf: 'stretch' }}>
              <p>• One plan for 12 months</p>
              <p>• A few short blocks every day</p>
              <p>• Works offline. Your data stays on this phone.</p>
            </div>
            <button className="btn primary" onClick={() => setStep(2)}>Get started</button>
          </div>
        )}

        {step === 2 && (
          <div className="stack">
            <h1 className="title1">When do you start?</h1>
            <Field label="Start date">
              <input className="input" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </Field>
            {startInPast && (
              <div className="card stack">
                <p className="callout">Starting late? No problem.</p>
                <Chips<'calendar' | 'day1'>
                  value={late}
                  onChange={setLate}
                  wrap
                  options={[{ value: 'calendar', label: 'Follow the calendar' }, { value: 'day1', label: 'Start from Day 1 today' }]}
                  label="Late start"
                />
                <p className="footnote">{late === 'calendar' ? 'We’ll put you on today’s day of the plan.' : `Day 1 will be today, ${formatDate(today)}.`}</p>
              </div>
            )}
            <h2 className="title2">When is your IELTS exam?</h2>
            <Field label="Exam date" hint="Not booked yet? Pick your best guess. You can change it later.">
              <input className="input" type="date" value={exam} onChange={(e) => { setExam(e.target.value); setEstimated(false); }} />
            </Field>
            <button className="btn plain" onClick={() => { setExam(lastSaturdayOfNov(Number(start.slice(0, 4)) + 1)); setEstimated(true); }}>I don’t know yet</button>
            {estimated && <p className="footnote">Estimated: {formatDate(exam, true)}.</p>}
            {tooShort && <p className="footnote" style={{ color: 'var(--warning)' }}>That’s less than 8 weeks. The plan needs about 12 months. Choose a later date or continue anyway.</p>}
            {!valid && <p className="footnote" style={{ color: 'var(--danger)' }}>{savedStart !== start ? `The exam must be after Day 1 (today, ${formatDate(today)}).` : 'The exam must be after the start date.'}</p>}
            <button className="btn primary" disabled={!valid} onClick={() => setStep(3)}>Continue</button>
          </div>
        )}

        {step === 3 && (
          <div className="stack">
            <h1 className="title1">What’s your target?</h1>
            <Field label="Overall band">
              <Chips<number> value={target} onChange={setTarget} options={[6.5, 7, 7.5].map((b) => ({ value: b, label: b.toFixed(1) }))} label="Overall band" />
            </Field>
            <Field label="University minimum per skill (optional)" hint="Many universities ask for a minimum in each skill, often 6.0 or 6.5. Check yours.">
              <BandPicker value={minSkill} onChange={setMinSkill} options={[5.5, 6, 6.5, 7]} />
            </Field>
            <button className="btn primary" onClick={() => setStep(4)}>Continue</button>
          </div>
        )}

        {step === 4 && (
          <div className="stack">
            <h1 className="title1">Keep it safe</h1>
            <div className="card stack">
              <p className="headline">Add to Home Screen</p>
              <p className="callout">In Safari, tap Share, then “Add to Home Screen”. The app opens full screen and works offline.</p>
            </div>
            <div className="card stack">
              <p className="headline">Reminders live in the app</p>
              <p className="callout">Open the app each day. Today shows your plan, and gentle reminders when something is due. There are no push notifications.</p>
            </div>
            <div className="card stack">
              <p className="headline">Back up once a week</p>
              <p className="callout">Your data stays on this phone. A backup file in Files or iCloud Drive keeps a year of work safe. The app will remind you.</p>
            </div>
            <button className="btn primary" onClick={() => void finish()}>Go to Today</button>
          </div>
        )}
      </div>
    </Screen>
  );
}
