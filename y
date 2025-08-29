{
  "indexes": [
    {
      "collectionGroup": "aiTutorSessions",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "lastMessageAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "practiceTests",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "stream",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "semester",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "difficulty",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "studyPlans",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "subjects",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "stream",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "semester",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "name",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "testAttempts",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "completedAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "stream",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "semester",
          "order": "ASCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
