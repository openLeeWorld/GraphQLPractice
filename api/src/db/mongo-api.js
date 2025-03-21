import mongoClient from './mongo-client';

const mongoApiWrapper = async () => {
    const { mdb } = await mongoClient();

    const mdbFindDocumentsByField = ({
        collectionName,
        fieldName,
        fieldValues,
    }) => 
        mdb 
        .collection(collectionName)
        .find({ [fieldName]: { $in: fieldValues } })
        .toArray();
    return {
        detailLists: async (approachIds) => { // 배치 로딩
            const mongoDocuments = await mdbFindDocumentsByField({
                collectionName: 'approachDetails',
                fieldName: 'pgId',
                fieldValues: approachIds,
            });

            return approachIds.map((approachId) => {
                const approachDoc = mongoDocuments.find(
                    (doc) => approachId === doc.pgId
                );

                if (!approachDoc) {
                    return [];
                }

                const { explanations, notes, warnings } = approachDoc; // 분해된 변수들이 각각의 배열값을 지님(정의x가능)
                const approachDetails = [];
                if (explanations) {
                    approachDetails.push(
                        ...explanations.map((explanationText) => ({
                            content: explanationText,
                            category: 'explanations',
                        }))
                    );
                }
                if (notes) {
                    approachDetails.push(
                        ...notes.map((noteText) => ({
                            content: noteText,
                            category: 'notes',
                        }))
                    );
                }
                if (warnings) {
                    approachDetails.push(
                        ...warnings.map((warningText) => ({
                            content: warningText,
                            category: 'warnings',
                        }))
                    );
                }
                return approachDetails;
            });
        },
        mutators: {
            approachDetailCreate: async (approachId, detailsInput) => {
                const details = {};
                detailsInput.forEach(({ content, category }) => {
                    details[category] = details[category] || [];
                    details[category].push(content);
                });
                return mdb.collection('approachDetails').insertOne({
                    pgId: approachId,
                    ...details,
                });
            },
        },
    };
};

export default mongoApiWrapper;