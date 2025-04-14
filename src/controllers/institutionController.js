async function getInstitutionDetails(req, res) {
  try {
    const institution = await Institutions.findByPk(req.params.id);
    
    if (!institution) {
      return res.status(404).json({ message: 'Institution not found' });
    }

    // Get all members with their details
    const members = await institution.getAllMembers();

    return res.json({
      institution: {
        id: institution.institutionId,
        name: institution.name,
        contactEmail: institution.contactEmail,
        teacherIds: institution.teacherIds,
        studentIds: institution.studentIds,
        teacherCount: institution.teacherCount,
        studentCount: institution.studentCount,
      },
      members
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Example of adding/removing members
async function addTeacherToInstitution(req, res) {
  try {
    const { institutionId, teacherId } = req.params;
    const institution = await Institutions.findByPk(institutionId);
    
    await institution.addTeacher(parseInt(teacherId));
    
    return res.json({ message: 'Teacher added successfully' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}