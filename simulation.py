import numpy as np

# random number generator
rng = np.random.default_rng()

def set_seed(seed):
    global rng
    rng = np.random.default_rng(seed)

# function to compute fitness
def compute_fitness(pop, z_opt, sigma_sel):
    d2 = np.sum((pop - z_opt) ** 2, axis=1)
    return np.exp(-d2 / (2 * sigma_sel**2))

# function to define 1D fitness landscape
def fitness_landscape_1d(z_opt, sigma_sel, n_points=500):
    z_min  = z_opt - 10
    z_max  = z_opt + 10
    z_vals = np.linspace(z_min, z_max, n_points)
    w_vals = np.exp(-(z_vals - z_opt) ** 2 / (2 * sigma_sel**2))
    return z_vals.tolist(), w_vals.tolist()

# function to define 2D fitness landscape
def fitness_landscape_2d(z_opt, sigma_sel, n_points=60):
    z1_min = z_opt[0] - 10
    z1_max = z_opt[0] + 10
    z2_min = z_opt[1] - 10
    z2_max = z_opt[1] + 10
    z1_vals = np.linspace(z1_min, z1_max, n_points)
    z2_vals = np.linspace(z2_min, z2_max, n_points)
    Z1, Z2  = np.meshgrid(z1_vals, z2_vals)
    d2      = (Z1 - z_opt[0]) ** 2 + (Z2 - z_opt[1]) ** 2
    W_grid  = np.exp(-d2 / (2 * sigma_sel**2))
    return z1_vals.tolist(), z2_vals.tolist(), W_grid.tolist()

# function for core FGM simulation
def evolve_fgm(z_init, z_opt, n_pop, n_gen, sigma_m, sigma_sel,
               mig_rate=0.0, mig_mean=None, mig_sd=1.0, init_spread=0.1):
	
    z_init = np.atleast_1d(np.array(z_init, dtype=float))
    z_opt  = np.atleast_1d(np.array(z_opt,  dtype=float))
    n_traits = len(z_init)

    # initialize population
    pop = np.tile(z_init, (n_pop, 1))
    pop += rng.normal(0, init_spread, size=pop.shape)

    # storage
    pop_history  = []
    mean_history = []
    fit_history  = []

    # cap population stored for landscape animation at 1000
    store_n = min(n_pop, 1000)

    def record(pop):
        W = compute_fitness(pop, z_opt, sigma_sel)
        pop_history.append(pop[:store_n].tolist())
        mean_history.append(pop.mean(axis=0).tolist())
        fit_history.append(float(W.mean()))

    record(pop)

    n_migrants = int(np.floor(mig_rate * n_pop))

    for t in range(n_gen):
		
        # migration
        if n_migrants > 0 and mig_mean is not None:
            mig_mean_arr = np.atleast_1d(np.array(mig_mean, dtype=float))
            immigrants   = rng.normal(mig_mean_arr, mig_sd,
                                      size=(n_migrants, n_traits))
            replace_idx  = rng.choice(n_pop, size=n_migrants, replace=False)
            pop[replace_idx] = immigrants
            
        # selection
        W = compute_fitness(pop, z_opt, sigma_sel)
        W_sum = W.sum()
        if W_sum == 0 or np.isnan(W_sum):
            p = np.ones(n_pop) / n_pop
        else:
            p = W / W_sum
        parent_idx = rng.choice(n_pop, size=n_pop, p=p)
        pop = pop[parent_idx]
        
        # mutation
        pop += rng.normal(0, sigma_m, size=pop.shape)
        record(pop)

    return pop_history, mean_history, fit_history

# function to run multiple replicates
def run_replicates(z_init, z_opt, n_pop, n_gen, sigma_m, sigma_sel,
                   n_reps, mig_rate=0.0, mig_mean=None, mig_sd=1.0,
                   init_spread=0.1):

    results = []
    for _ in range(n_reps):
        pop_history, mean_history, fit_history = evolve_fgm(
            z_init, z_opt, n_pop, n_gen, sigma_m, sigma_sel,
            mig_rate, mig_mean, mig_sd, init_spread
        )
        results.append({
            'pop_history' : pop_history,
            'mean_history': mean_history,
            'fit_history' : fit_history
        })
    return results
