import { InfoPanel, InfoRow, PeopleEditor } from './InfoPhase';
import { makeEmptyPerson } from './PersonForm';
import { useLandEditor, LandForm } from '../LandFields';

// Above every licensing phase: land and people (compact), then the request's description.
export default function LicensingDetails({ client, onUpdateClient, info, onChange }) {
  const { land, updateLand, flushLand } = useLandEditor(client, onUpdateClient);

  const patch = (key, value) => onChange({ [key]: value });

  return (
    <>
      <div className="licensing-details" onBlur={flushLand}>
        <InfoPanel>
          <InfoRow title="פרטי קרקע">
            <LandForm land={land} onChange={updateLand} />
          </InfoRow>

          <InfoRow
            title="פרטי מבקש"
            actions={<button type="button" className="link-btn" onClick={() => patch('requesters', [...info.requesters, makeEmptyPerson()])}>+ הוספה</button>}
          >
            <PeopleEditor people={info.requesters} onChange={next => patch('requesters', next)} />
          </InfoRow>

          <InfoRow
            title="בעלי זכות"
            actions={<button type="button" className="link-btn" onClick={() => patch('rights_holders', [...info.rights_holders, makeEmptyPerson()])}>+ הוספה</button>}
          >
            <PeopleEditor
              people={info.rights_holders}
              onChange={next => patch('rights_holders', next)}
              copyFrom={{ people: info.requesters, label: 'המבקשים' }}
            />
          </InfoRow>
        </InfoPanel>
      </div>

      <InfoPanel>
        <InfoRow title="מהות בקשה">
          <textarea
            value={info.description}
            onChange={e => patch('description', e.target.value)}
            placeholder="תיאור מהות הפרויקט"
            rows={2}
          />
        </InfoRow>
      </InfoPanel>
    </>
  );
}
