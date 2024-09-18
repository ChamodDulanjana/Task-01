import {useEffect, useState} from 'react'
import axios from "axios";
import Notification from "./component/notification.tsx";

function App() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [vehicles, setVehicles] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 100;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [formValues, setFormValues] = useState({ first_name: '', last_name: '', email: '' });
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isNotificationVisible, setNotificationVisible] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');

    // Fetch all vehicles when the component mounts
    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const response = await axios.post('http://localhost:3001/graphql', {
                    query: `
            query {
            vehicles(limit: ${itemsPerPage}, offset: ${(currentPage - 1) * itemsPerPage}) {
              id
              first_name
              last_name
              email
              car_make
              car_model
              vin
              manufactured_date
              age_of_vehicle
            }
          }
          `
                });
                setVehicles(response.data.data.vehicles);
            } catch (error) {
                console.error('Error fetching vehicles:', error);
            }
        };

        fetchVehicles();
    }, [currentPage]);


    const handleUpload = () => {
        if (!selectedFile) {
            alert('Please select a file');
            return;
        }

        // Create FormData and append file
        const formData = new FormData();

        // Append GraphQL query as JSON
        formData.append(
            'operations',
            JSON.stringify({
                query: `
          mutation  uploadCsvFile($file: Upload!) {
             uploadCsvFile(file: $file)
          }
        `,
                variables: {
                    file: null,
                },
            })
        );

        // Append the file to the map
        formData.append('map', JSON.stringify({ '0': ['variables.file'] }));
        formData.append('0', selectedFile);

        // Send request
        axios
            .post('http://localhost:3000/graphql', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'x-apollo-operation-name': 'uploadCsvFile',
                },
            })
            .then((response) => {
                console.log('File uploaded successfully', response.data);
            })
            .catch((error) => {
                console.error('Error uploading file', error);
            });
    }


    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    }

    const handleExport = (age: number) => {
        // Send export request via GraphQL with age
        console.log(`Export cars older than ${age} years`);

        const query = `
        mutation {
            exportVehiclesByAge(age: ${age})
        }
    `;

        axios.post('http://localhost:3002/graphql', {
            query: query
        })
            .then((response) => {
                console.log('Export successful', response.data);
                setNotificationMessage('Export completed successfully!');
                setNotificationVisible(true);
            })
            .catch((error) => {
                console.error('Error exporting vehicles', error);
            });

        setDropdownOpen(false); // Close dropdown after selection
    };

    const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (query.length > 0) {
            const graphqlQuery = `
        query {
              searchVehicle(search: "${query}", limit: ${itemsPerPage}, offset: ${(currentPage - 1) * itemsPerPage}) {
                id
                first_name
                last_name
                email
                car_make
                car_model
                vin
                manufactured_date
                age_of_vehicle
              }
            }
      `;

            try {
                const response = await axios.post('http://localhost:3001/graphql', {
                    query: graphqlQuery
                });
                setVehicles(response.data.data.searchVehicle);
            } catch (error) {
                console.error('Error during search:', error);
            }
        } else {
            // Optionally, you could refetch all vehicles if the search query is cleared
            const response = await axios.post('http://localhost:3001/graphql', {
                query: `
          query {
            vehicles(limit: ${itemsPerPage}, offset: ${(currentPage - 1) * itemsPerPage}) {
              id
              first_name
              last_name
              email
              car_make
              car_model
              vin
              manufactured_date
              age_of_vehicle
            }
          }
        `
            });
            setVehicles(response.data.data.vehicles);
        }
    };

    const handleNextPage = () => {
        setCurrentPage(prevPage => prevPage + 1);
    };

    const handlePreviousPage = () => {
        setCurrentPage(prevPage => (prevPage > 1 ? prevPage - 1 : 1));
    };

    // Open the modal with the selected vehicle's information
    const handleUpdateClick = (vehicle) => {
        setSelectedVehicle(vehicle);
        setFormValues({
            first_name: vehicle.first_name,
            last_name: vehicle.last_name,
            email: vehicle.email,
        });
        setIsModalOpen(true);
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormValues((prevValues) => ({
            ...prevValues,
            [name]: value,
        }));
    };

    // Submit the update mutation
    const handleUpdateSubmit = async () => {
        try {
            const { id } = selectedVehicle;
            const { first_name, last_name, email } = formValues;

            await axios.post('http://localhost:3001/graphql', {
                query: `
          mutation {
            updateVehicle(updateVehicleInput: { id: ${id}, first_name: "${first_name}", last_name: "${last_name}", email: "${email}"}) {
              id
            }
          }
        `,
            });

            // Close modal after update
            setIsModalOpen(false);

            // Fetch updated vehicles list (optional)
            const response = await axios.post('http://localhost:3001/graphql', {
                query: `
          query {
            vehicles(limit: ${itemsPerPage}, offset: ${(currentPage - 1) * itemsPerPage}) {
              id
              first_name
              last_name
              email
              car_make
              car_model
              vin
              manufactured_date
              age_of_vehicle
            }
          }
        `,
            });
            setVehicles(response.data.data.vehicles);
        } catch (error) {
            console.error('Error updating vehicle:', error);
        }
    };

    // Close the modal
    const closeModal = () => {
        setIsModalOpen(false);
    };

    // Handle delete button click and open delete confirmation modal
    const handleDeleteClick = (vehicle) => {
        setSelectedVehicle(vehicle);
        setIsDeleteModalOpen(true);
    };

    // Submit the delete mutation
    const handleDeleteConfirm = async () => {
        try {
            const { id } = selectedVehicle;

            await axios.post('http://localhost:3001/graphql', {
                query: `
          mutation {
            removeVehicle(id: ${id})
          }
        `,
            });

            // Close delete modal after delete
            setIsDeleteModalOpen(false);

            // Fetch updated vehicles list after deletion
            const response = await axios.post('http://localhost:3001/graphql', {
                query: `
          query {
            vehicles(limit: ${itemsPerPage}, offset: ${(currentPage - 1) * itemsPerPage}) {
              id
              first_name
              last_name
              email
              car_make
              car_model
              vin
              manufactured_date
              age_of_vehicle
            }
          }
        `,
            });
            setVehicles(response.data.data.vehicles);
        } catch (error) {
            console.error('Error deleting vehicle:', error);
        }
    };

    // Close delete modal
    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
    };

    return (
        <div className="flex flex-col items-center gap-20 w-full h-full">

            <Notification
                message={notificationMessage}
                isVisible={isNotificationVisible}
                onClose={() => setNotificationVisible(false)}
            />

            <h1 className="mt-8 font-bold text-3xl">Vehicle Management System</h1>

            <div className="flex mb-4">
                <input
                    type="text"
                    placeholder="Search Here..."
                    className="w-[70vw] p-2 border rounded-md border-gray-300 shadow-md mr-6 outline-none"
                    value={searchQuery}
                    onChange={handleSearch}
                />
                <input
                    onChange={(e) => handleFileChange(e)}
                    className="w-[100px] mt-[6px]"
                    type="file"/>
                <button
                    onClick={handleUpload}
                    className="bg-blue-900 px-5 py-2 rounded-lg font-medium active:bg-blue-600 transition-all ml-1 mr-3 text-white"
                >
                    Upload
                </button>
                <div>
                    <button
                        className="bg-black px-5 py-2.5 rounded-lg font-medium active:bg-gray-600 transition-all ml-1 text-white"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                        Export
                    </button>

                    {/*{/!* Dropdown Menu *!/}*/}
                    {dropdownOpen && (
                        <div
                            className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-lg shadow-lg">
                            {[
                                {label: 'Over 5 years', value: 5},
                                {label: 'Over 6 years', value: 6},
                                {label: 'Over 7 years', value: 7},
                                {label: 'Over 8 years', value: 8},
                                {label: 'Over 9 years', value: 9},
                                {label: 'Over 10 years', value: 10},
                                {label: 'Over 15 years', value: 15},
                                {label: 'Over 20 years', value: 20},
                                {label: 'Over 30 years', value: 30}
                            ].map((option, index) => (
                                <button
                                    key={index}
                                    className="block w-full text-left px-4 py-2 hover:bg-gray-200"
                                    onClick={() => handleExport(option.value)}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/*{/!* Table *!/}*/}
            <table className="table-auto w-[93vw] border-collapse border border-gray-300 shadow-md">
                <thead>
                <tr className="bg-gray-200">
                    <th className="p-2 border">ID</th>
                    <th className="p-2 border">First Name</th>
                    <th className="p-2 border">Last Name</th>
                    <th className="p-2 border">Email</th>
                    <th className="p-2 border">Car Make</th>
                    <th className="p-2 border">Car Model</th>
                    <th className="p-2 border">VIN</th>
                    <th className="p-2 border">Manufacture Date</th>
                    <th className="p-2 border">Age</th>
                    <th className="p-2 border">Update</th>
                    <th className="p-2 border">Delete</th>
                </tr>
                </thead>
                <tbody>
                {vehicles.length > 0 ? (
                    vehicles.map((vehicle: any) => (
                        <tr key={vehicle.id}>
                            <td className="p-2 border">{vehicle.id}</td>
                            <td className="p-2 border">{vehicle.first_name}</td>
                            <td className="p-2 border">{vehicle.last_name}</td>
                            <td className="p-2 border">{vehicle.email}</td>
                            <td className="p-2 border">{vehicle.car_make}</td>
                            <td className="p-2 border">{vehicle.car_model}</td>
                            <td className="p-2 border">{vehicle.vin}</td>
                            <td className="p-2 border">{new Date(vehicle.manufactured_date).toLocaleDateString('en-CA')}</td>
                            <td className="p-2 border">{vehicle.age_of_vehicle}</td>
                            <td className="p-2 border">
                                <button
                                    className="bg-blue-500 text-white p-1 rounded"
                                    onClick={() => handleUpdateClick(vehicle)}
                                >
                                    Update
                                </button>
                            </td>
                            <td className="p-2 border">
                                <button
                                    className="bg-red-500 text-white p-1 rounded"
                                    onClick={() => handleDeleteClick(vehicle)}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td className="p-2 border text-center" colSpan={11}>
                            No vehicles found
                        </td>
                    </tr>
                )}
                </tbody>
            </table>

            <div className="mt-4 flex justify-between gap-5 mb-10">
                <button
                    onClick={handlePreviousPage}
                    className="bg-gray-500 text-white p-2 rounded w-20"
                    disabled={currentPage === 1}
                >
                    Previous
                </button>
                <button
                    onClick={handleNextPage}
                    className="bg-blue-500 text-white p-2 rounded w-20"
                >
                    Next
                </button>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50">
                    <div className="bg-white p-4 rounded shadow-lg w-96">
                        <h2 className="text-xl mb-4">Update Vehicle</h2>
                        <div className="mb-4">
                            <label className="block mb-1">First Name</label>
                            <input
                                type="text"
                                name="first_name"
                                value={formValues.first_name}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-md"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block mb-1">Last Name</label>
                            <input
                                type="text"
                                name="last_name"
                                value={formValues.last_name}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-md"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block mb-1">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formValues.email}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-md"
                            />
                        </div>
                        <div className="flex justify-end">
                            <button onClick={closeModal} className="bg-gray-500 text-white p-2 rounded mr-2">
                                Cancel
                            </button>
                            <button onClick={handleUpdateSubmit} className="bg-blue-500 text-white p-2 rounded">
                                Update
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isDeleteModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50">
                    <div className="bg-white p-4 rounded shadow-lg w-96">
                        <h2 className="text-xl mb-4">Are you sure you want to delete this vehicle?</h2>
                        <div className="flex justify-end">
                            <button onClick={closeDeleteModal} className="bg-gray-500 text-white p-2 rounded mr-2">
                                Cancel
                            </button>
                            <button onClick={handleDeleteConfirm} className="bg-red-500 text-white p-2 rounded">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default App;
