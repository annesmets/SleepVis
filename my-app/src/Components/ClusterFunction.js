import React, { useEffect } from 'react'
let hungarian = require('hungarian-on3');

// Align sequences
const alignSequences = (target, compared) => {
    let n_event = 0;

    let target_copy = [];
    let compared_copy = [];

    // Make a copy of the target array
    target_copy.push(...target);
    compared_copy.push(...compared);

    let j = 0;
    // While j is smaller than the length of the shortest sequence
    while (j < Math.min(target_copy.length, compared_copy.length)) {

        // If the states are not equal, add 0 at that index
        if (target_copy[j].state !== compared_copy[j].state) {
            n_event = n_event + 1;
            if (target_copy.length > compared_copy.length) {
                // Target bigger
                compared_copy.splice(j, 0, 0);
            } else { 
                // Compared bigger or state not equal when they have the same length
                target_copy.splice(j, 0, 0);
            };
        };

        j = j+1;
    };

    // If the length is not equal, add 0 at the end of the shortest sequence
    while(target_copy.length !== compared_copy.length) {
        n_event = n_event + 1;
        if (target_copy.length > compared_copy.length) {
            // Target bigger
            compared_copy.splice(j, 0, 0);
        } else {    // if (target_copy.length < compared_copy.length)
            // Compared bigger
            target_copy.splice(j, 0, 0);
        };

        j = j+1;
    };

    // Get D' and the number of null events added
    return [calculateDistances(target_copy, compared_copy), n_event];
};

// Calculate the distance matrix
const calculateDistances = (target_copy, compared_copy) => {
    // Create new matrix
    let distmatrix = [];
    for(var i=0; i<target_copy.length; i++) {
        distmatrix[i] = new Array(target_copy.length).fill(0);
    };

    // Fill the matrix using the distance metric
    for (let m=0; m < target_copy.length; m++) {

        for (let n=0; n < compared_copy.length; n++) {
            if (target_copy[m] === 0 || compared_copy[n] === 0) {
                distmatrix[m][n] = 0;
            } else if (target_copy[m].state === 0 || compared_copy[n].state === 0) {
                distmatrix[m][n] = Infinity;
            } else if (target_copy[m].state === compared_copy[n].state) {
                distmatrix[m][n] =  Math.abs(target_copy[m].start_clus - compared_copy[n].start_clus) / (1000*60)
            } else {
                distmatrix[m][n] = Infinity;
            };
        };
    };

    // Use Hungarian Algorithm to find the optimal assignment
    let optimal = hungarian(distmatrix);

    // Sum the values with the indexes that are returned by the Hungarian Algorithm
    let d_prime = 0;
    for (let i=0; i < optimal.length; i++) {
        d_prime = d_prime + distmatrix[optimal[i][0]][optimal[i][1]];
    };

    // Return D'
    return d_prime;
};

const ClusterFunction = (props) => {
    const epsilon = props.epsilon;
    const dataFilter = props.clusterFilter;

    const data = (props.data)
    .filter(d => {
        if (dataFilter.length === 0) {
            return props.data; 
        } else {
            return (dataFilter.includes(d.id)) 
        }
    }); 

    useEffect(() => {
        // M&M method
        if (data.length > 0) {
            // Create new matrices
            let dprimematrix = [];      //Store D'
            let match_matrix = [];      //Store match scores
            let mismatch_matrix = [];   //Store mismatch scores
            let total_matrix = [];      //Store total scores
            let nmatrix = [];           //Store # mismatches

            let length = data.length;

            for(var i=0; i<length; i++) {
                dprimematrix[i] = new Array(length).fill(0);
                match_matrix[i] = new Array(length).fill(0);
                mismatch_matrix[i] = new Array(length).fill(0);
                total_matrix[i] = new Array(length).fill(0);        //change 0/1 ==> need 0, night A is completely similar to night A, which is a score of 1 (higher score is higher similarity)
                nmatrix[i] = new Array(length).fill(0);
            };

            // Create array to store Dmax for each target
            let dmax = new Array(length).fill(0);

            // Create array to store Nmax for each target
            let nmax = new Array(length).fill(0);

            const w = 0.8
            
            // Loop over the data
            for (var k=0; k<length; k++) {
                let target = data[k].states;

                // Fill matrix, get D'max and Nmax
                for (var j=0; j<length; j++) {
                    if (j !== k) {
                        let compared = data[j].states;

                        if (compared.length > 0) {
                            let [d_prime, n] = alignSequences(target, compared);

                            dprimematrix[k][j] = d_prime;
                            nmatrix[k][j] = n;

                            if (dprimematrix[k][j] > dmax[k]) {
                                dmax[k] = dprimematrix[k][j];
                            };

                            if (nmatrix[k][j] > nmax[k]) {
                                nmax[k] = nmatrix[k][j];
                            };
                        };
                    };

                };

                // Calculate the scores
                for (j=0; j<length; j++) {
                    if (j !== k) {    
                        if (dprimematrix[k][j] === 0) {
                            match_matrix[k][j] = 1;
                        } else {
                            match_matrix[k][j] = ((dmax[k] - dprimematrix[k][j])/dmax[k]) * 0.98 + 0.01;
                        };   
                        
                        if (nmatrix[k][j] === 0) {
                            mismatch_matrix[k][j] = 1;
                        } else {
                            mismatch_matrix[k][j] = ((nmax[k] - nmatrix[k][j])/nmax[k]) * 0.98 + 0.01;
                        };

                        total_matrix[k][j] = (w * match_matrix[k][j]) + ((1-w) * mismatch_matrix[k][j]);
                    };
                };

                // Store total scores vector in the data
                data[k]['total_score'] = total_matrix[k]
            };

            // Cluster the data
            const clustering = require('density-clustering')
            const dbscan = new clustering.DBSCAN();
            const clusters = dbscan.run(total_matrix, epsilon, 4)

            for (let d=0; d < data.length; d++) {
                for (let c=0; c < clusters.length; c++) {
                    if (clusters[c].includes(d)) {
                        data[d]['cluster'] = c;
                        break
                    } else {
                        data[d]['cluster'] = 'N';
                    }
                }
            };
        };
    }, [data,epsilon])
    
    return (
        <div>
            
        </div>
    )
}

export default ClusterFunction