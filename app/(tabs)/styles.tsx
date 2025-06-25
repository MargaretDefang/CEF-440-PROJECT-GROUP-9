import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  // Add your styles here
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeader: {
    width: '100%',
    height: 80,
    padding: 16,
    alignItems: 'center',
  },
  modalHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  closeButton: {
    padding: 8,
  },
  modalSubtitle: {
    color: 'white',
    marginTop: 16,
    textAlign: 'center',
  },
});
